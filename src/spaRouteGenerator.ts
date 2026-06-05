import type {
  NavigationGuardWithThis,
  RouteRecordRaw,
} from "vue-router";
import type { CreateNnnRoutesOptions } from "./types";
import type { NnnRouteMeta } from "./types";
import {
  dynamicScore,
  isMiddlewareKey,
  isRedirectKey,
  middlewareDirFromNormKey,
  normalizePath,
  pathFromSegments,
  redirectDirFromNormKey,
  stripRoutesRoot,
} from "./path";
import { simplifyGlobKey, unwrapDefault } from "./globUtils";

const PAGE_EXT = /\.(vue|tsx|jsx|ts|js)$/i;

/** Basename file layout (không phải segment URL). */
const LAYOUT_BASENAME = "_layout";

function isLikelyRouteFileKey(sk: string): boolean {
  if (!PAGE_EXT.test(sk)) return false;
  if (/\.(ts|js)$/i.test(sk) && /_middleware\.(ts|js)$/i.test(sk)) return false;
  if (/\.(ts|js)$/i.test(sk) && /_redirect\.(ts|js)$/i.test(sk)) return false;
  return true;
}

/** Cảnh báo khi `routesRoot` không strip được `..` trong key (lỗi cấu hình thường gặp). */
export function warnIfRoutesRootLikelyWrong(
  rows: readonly { sk: string }[],
  routesRoot: string | undefined,
  silent: boolean | undefined
): void {
  if (silent === true || !routesRoot?.trim()) return;
  const targets = rows.filter((r) => isLikelyRouteFileKey(r.sk));
  if (targets.length === 0) return;
  const bad = targets.filter((r) => /\.\.(?:\/|$)/.test(r.sk)).length;
  if (bad >= 1) {
    console.warn(
      `[vue-nnn-router] ${bad}/${targets.length} route key(s) still contain ".." after routesRoot="${routesRoot}". ` +
        `Set routesRoot to match the actual glob key prefix (e.g. pattern ../pages/** → routesRoot: "../pages").`,
    );
  }
}

/** Tên segment filesystem `[slug]` hoặc basename file `[slug].vue` → `:slug` trong URL. */
export function segmentUrlFromFs(fsSeg: string): string {
  const s = fsSeg.replace(/\\/g, "/");
  if (s.startsWith("[") && s.endsWith("]")) return `:${s.slice(1, -1)}`;
  return s;
}

/** Key glob đã strip `routesRoot`; trả pathname không có ext (vd `users/add`). */
export function pathNoExt(strippedSk: string): string {
  return strippedSk.replace(/\\/g, "/").split("?")[0].replace(PAGE_EXT, "");
}

/** Tiền tố cascade `_middleware.ts` SPA. */
export function mwPrefixesForPathNoExt(pn: string): string[] {
  const parts = pn.split("/").filter(Boolean);
  const dirParts = parts.length >= 1 ? parts.slice(0, -1) : [];
  const prefixes: string[] = [];
  for (let i = 0; i < dirParts.length; i++) {
    prefixes.push(dirParts.slice(0, i + 1).join("/"));
  }
  if (prefixes.length === 0 || prefixes[0] !== "") prefixes.unshift("");
  return prefixes;
}

type PageRec = {
  basenameLc: string;
  rawKey: string;
  modIn: unknown;
  pathNoExt: string;
  order: number;
};

type TrieNode = {
  layout?: { rawKey: string; modIn: unknown; pathNoExt: string };
  redirect?: { rawKey: string; modIn: unknown; pathNoExt: string };
  pages: Map<string, PageRec>;
  dirs: Map<string, TrieNode>;
};

function trieEmpty(): TrieNode {
  return { pages: new Map(), dirs: new Map() };
}

function trieEnsure(root: TrieNode, fsDirs: readonly string[]): TrieNode {
  let cur = root;
  for (const d of fsDirs) {
    if (!cur.dirs.has(d)) cur.dirs.set(d, trieEmpty());
    cur = cur.dirs.get(d)!;
  }
  return cur;
}

type Cmp = Exclude<RouteRecordRaw["component"], undefined | null>;

function lazyTop(mod: unknown): boolean {
  return typeof mod === "function" && unwrapDefault(mod) === mod;
}

function toCmp(mod: unknown): Cmp {
  if (lazyTop(mod)) return mod as Cmp;
  const x = unwrapDefault(mod);
  if (typeof x === "function") return x as Cmp;
  if (typeof x === "object" || typeof x === "string") return x as Cmp;
  if (mod !== null && typeof mod === "function") return mod as Cmp;
  throw new Error(
    "[vue-nnn-router] Invalid default export (expected a Vue component or lazy import)."
  );
}

function routeMw(mod: unknown): unknown {
  return !lazyTop(mod) &&
    typeof mod === "object" &&
    mod !== null &&
    Object.prototype.hasOwnProperty.call(mod, "middleware")
    ? (mod as { middleware?: unknown }).middleware
    : undefined;
}

function normGuards(g: unknown): NavigationGuardWithThis<undefined>[] {
  if (g === undefined || g === null) return [];
  const a = Array.isArray(g) ? g : [g];
  return a.filter(
    (x): x is NavigationGuardWithThis<undefined> => typeof x === "function"
  );
}

function guards(
  pagePathNoExt: string,
  mwMap: Map<string, unknown>,
  pageMod?: unknown
) {
  const out: NavigationGuardWithThis<undefined>[] = [];
  for (const p of mwPrefixesForPathNoExt(pagePathNoExt)) {
    const mw = mwMap.get(p);
    if (!mw) continue;
    out.push(...normGuards(unwrapDefault(mw)));
  }
  out.push(...normGuards(routeMw(pageMod)));
  return out;
}

/**
 * Path con (không có `/` đầu).
 * Basename có thể `index`, `add`, hoặc **`[id]`** → **`:id`** (giống segment thư mục).
 */
function vueRel(fsRawPrefixes: readonly string[], basenameLc: string): string {
  const dirs = fsRawPrefixes.map(segmentUrlFromFs);
  const j = dirs.join("/");
  if (basenameLc === "index") return j;
  const leafSeg = segmentUrlFromFs(basenameLc);
  return j ? `${j}/${leafSeg}` : leafSeg;
}

/** URL `:param`; `mount` + segment FS + basename (kể cả `[id].vue`). */
function absPiecesJoined(
  mountUrlPieces: readonly string[],
  fsRawRel: readonly string[],
  basenameLc: string
): string[] {
  const tail =
    basenameLc === "index" ? [] : [segmentUrlFromFs(basenameLc)];
  const middle = [...fsRawRel.map(segmentUrlFromFs)];
  return [...mountUrlPieces, ...middle, ...tail];
}

function absHref(pieces: readonly string[], pf: string): string {
  return normalizePath(pathFromSegments([...pieces], pf) || "/");
}

function cmpFs(a: string, b: string): number {
  const da = segmentUrlFromFs(a).includes(":");
  const db = segmentUrlFromFs(b).includes(":");
  if (da !== db) return da ? 1 : -1;
  return a.localeCompare(b);
}

type Built = RouteRecordRaw & {
  _dyn: number;
  _abs: string;
  _fk: string;
  _order: number;
};

function nm(abs: string): string {
  if (abs === "/" || abs === "") return "home";
  return (
    abs
      .replace(/^\/+|\/+$/g, "")
      .replace(/\//g, "-")
      .replace(/:/g, "") || "route"
  );
}

function makeLeaf(
  routePathPattern: string,
  absDedupe: string,
  pg: PageRec,
  mwMap: Map<string, unknown>,
  sq: { seq: number }
): Built {
  const gs = guards(pg.pathNoExt, mwMap, pg.modIn);
  const be =
    gs.length === 0 ? undefined : gs.length === 1 ? gs[0]! : gs;
  return {
    path: routePathPattern,
    component: toCmp(pg.modIn),
    beforeEnter: be,
    meta: { nnnFile: pg.rawKey } satisfies NnnRouteMeta,
    name: nm(absDedupe),
    _dyn: dynamicScore(absDedupe),
    _abs: absDedupe,
    _fk: pg.rawKey,
    _order: sq.seq++,
  };
}

type Cfg = {
  mwMap: Map<string, unknown>;
  pf: string;
  sq: { seq: number };
  silent?: boolean;
};

function hasIndexPage(node: TrieNode): boolean {
  return node.pages.has("index");
}

/** `export default` trong `_redirect.ts`: URL tuyệt đối (`/users/add`) hoặc tương đối (`add`). */
function resolveRedirectTarget(
  modIn: unknown,
  mountPieces: readonly string[],
  pf: string,
): string | null {
  const raw = unwrapDefault(modIn);
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("/")) return normalizePath(t);
  const pieces = [...mountPieces, ...t.split("/").filter(Boolean)];
  return absHref(pieces, pf);
}

function injectLayoutRedirect(
  acc: Built[],
  node: TrieNode,
  mountPieces: readonly string[],
  cfg: Cfg,
): void {
  if (hasIndexPage(node) || !node.redirect) return;

  const layoutAbs = absHref(mountPieces, cfg.pf);
  const target = resolveRedirectTarget(node.redirect.modIn, mountPieces, cfg.pf);
  if (!target) {
    if (cfg.silent !== true) {
      console.warn(
        `[vue-nnn-router] Invalid _redirect in "${node.redirect.rawKey}" (expected export default string).`,
      );
    }
    return;
  }

  acc.unshift({
    path: "",
    redirect: target,
    name: `${nm(layoutAbs)}-redirect`,
    meta: { nnnFile: node.redirect.rawKey } satisfies NnnRouteMeta,
    _dyn: 0,
    _abs: layoutAbs,
    _fk: node.redirect.rawKey,
    _order: cfg.sq.seq++,
  } as Built);
}

function childrenInsideLayout(node: TrieNode, mountPieces: readonly string[], cfg: Cfg): Built[] {
  const acc: Built[] = [];

  for (const [, pg] of [...node.pages.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (pg.basenameLc === LAYOUT_BASENAME) continue;
    const pieces = absPiecesJoined(mountPieces, [], pg.basenameLc);
    const ah = absHref(pieces, cfg.pf);
    acc.push(makeLeaf(vueRel([], pg.basenameLc), ah, pg, cfg.mwMap, cfg.sq));
  }

  for (const [fs, cn] of [...node.dirs.entries()].sort((a, b) => cmpFs(a[0], b[0]))) {
    const segUrl = segmentUrlFromFs(fs);
    if (cn.layout) {
      const nextMount = [...mountPieces, segUrl];
      const absLay = absHref(nextMount, cfg.pf);
      const nested = childrenInsideLayout(cn, nextMount, cfg);
      acc.push({
        path: segUrl,
        component: toCmp(cn.layout!.modIn),
        children: nested,
        name: `${nm(absLay)}-layout`,
        meta: {},
        _dyn: dynamicScore(absLay),
        _abs: absLay,
        _fk: cn.layout!.rawKey,
        _order: cfg.sq.seq++,
      } as Built);
    } else {
      acc.push(...flattenNoLay(cn, mountPieces, [fs], cfg));
    }
  }

  injectLayoutRedirect(acc, node, mountPieces, cfg);

  return acc.sort((x, y) =>
    x._dyn !== y._dyn ? x._dyn - y._dyn : String(x.path).localeCompare(String(y.path))
  );
}

function flattenNoLay(
  node: TrieNode,
  mountPieces: readonly string[],
  fsRelRaw: readonly string[],
  cfg: Cfg,
): Built[] {
  const acc: Built[] = [];

  for (const [, pg] of [...node.pages.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (pg.basenameLc === LAYOUT_BASENAME) continue;
    const pieces = absPiecesJoined(mountPieces, fsRelRaw, pg.basenameLc);
    const ah = absHref([...pieces], cfg.pf);
    acc.push(makeLeaf(vueRel(fsRelRaw, pg.basenameLc), ah, pg, cfg.mwMap, cfg.sq));
  }

  for (const [fs, cn] of [...node.dirs.entries()].sort((a, b) => cmpFs(a[0], b[0]))) {
    if (cn.layout) {
      const vrSeg = vueRel(fsRelRaw, fs);
      const mp = [...mountPieces, ...fsRelRaw.map(segmentUrlFromFs), segmentUrlFromFs(fs)];
      const ah = absHref(mp, cfg.pf);
      acc.push({
        path: vrSeg,
        component: toCmp(cn.layout!.modIn),
        children: childrenInsideLayout(cn, mp, cfg),
        name: `${nm(ah)}-layout`,
        meta: {},
        _dyn: dynamicScore(ah),
        _abs: ah,
        _fk: cn.layout!.rawKey,
        _order: cfg.sq.seq++,
      } as Built);
    } else {
      acc.push(...flattenNoLay(cn, mountPieces, [...fsRelRaw, fs], cfg));
    }
  }

  return acc;
}

function emitFlatTopSubtree(node: TrieNode, outerPieces: readonly string[], cfg: Cfg): Built[] {
  const acc: Built[] = [];

  for (const [, pg] of [...node.pages.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (pg.basenameLc === LAYOUT_BASENAME) continue;
    const pieces = [...outerPieces.map(segmentUrlFromFs)];
    const rest =
      pg.basenameLc === "index" ? [] : [segmentUrlFromFs(pg.basenameLc)];
    const ah = absHref([...pieces, ...rest], cfg.pf);
    acc.push(makeLeaf(ah, ah, pg, cfg.mwMap, cfg.sq));
  }

  for (const [fs, cn] of [...node.dirs.entries()].sort((a, b) => cmpFs(a[0], b[0]))) {
    const pref = [...outerPieces, fs];
    if (cn.layout) {
      const mount = pref.map(segmentUrlFromFs);
      const pathTop = normalizePath(absHref(mount, cfg.pf));
      acc.push({
        path: pathTop,
        component: toCmp(cn.layout!.modIn),
        children: childrenInsideLayout(cn, mount, cfg),
        name: `${nm(pathTop)}-layout`,
        meta: {},
        _dyn: dynamicScore(pathTop),
        _abs: pathTop,
        _fk: cn.layout!.rawKey,
        _order: cfg.sq.seq++,
      } as Built);
    } else acc.push(...emitFlatTopSubtree(cn, pref, cfg));
  }

  return acc;
}

function stripBuilt(r: Built): RouteRecordRaw {
  const { _dyn, _abs, _fk, _order, children, ...rest } = r;
  void _dyn;
  void _abs;
  void _fk;
  void _order;
  if (children && children.length) {
    return {
      ...rest,
      children: (children as Built[]).map((c) => stripBuilt(c)),
    } as RouteRecordRaw;
  }
  const { meta, ...rno } = rest;
  if (meta && Object.keys(meta).length === 0) {
    delete (rno as { meta?: unknown }).meta;
    return rno as RouteRecordRaw;
  }
  return rest as RouteRecordRaw;
}

function finalizeTree(xs: Built[]): RouteRecordRaw[] {
  return xs.map((r) => stripBuilt(r));
}

function collectLeaves(xs: Built[], into: Built[]): void {
  for (const r of xs) {
    if (r.children && r.children.length)
      collectLeaves(r.children as Built[], into);
    else into.push(r);
  }
}

function pruneTree(rs: Built[], keepLeaf: Map<string, Built>): Built[] {
  const recurse = (r: Built): Built | null => {
    if (r.children && r.children.length) {
      const ch = (r.children as Built[]).map(recurse).filter(Boolean) as Built[];
      return ch.length ? ({ ...r, children: ch } as Built) : null;
    }
    return keepLeaf.get(r._abs) === r ? r : null;
  };
  return rs.map(recurse).filter(Boolean) as Built[];
}

/** Public: sinh RouteRecordRaw SPA. */
export function createSpaNnnRoutes(
  globRecord: Record<string, unknown>,
  options: CreateNnnRoutesOptions = {},
): RouteRecordRaw[] {
  const pf = options.prefix?.replace(/^\/+|\/+$/g, "") ?? "";
  const logFn =
    options.silent !== true
      ? (options.logger ?? ((...a: unknown[]) => console.log(...a)))
      : undefined;

  type Row = { rawKey: string; sk: string; modIn: unknown };
  const rows: Row[] = Object.entries(globRecord).map(([rawKey, modIn]) => ({
    rawKey,
    sk: stripRoutesRoot(simplifyGlobKey(rawKey), options.routesRoot),
    modIn,
  }));

  warnIfRoutesRootLikelyWrong(rows, options.routesRoot, options.silent);

  const mwMap = new Map<string, unknown>();
  const mwSeen = new Map<string, string>();
  for (const { rawKey, sk, modIn } of rows) {
    if (!isMiddlewareKey(sk)) continue;
    const d = middlewareDirFromNormKey(sk);
    const prev = mwSeen.get(d);
    if (
      prev !== undefined &&
      prev !== rawKey &&
      options.silent !== true
    ) {
      console.warn(`[vue-nnn-router] Duplicate middleware for "${d || "/"}".`);
    }
    mwSeen.set(d, rawKey);
    mwMap.set(d, modIn);
  }

  const root = trieEmpty();
  let ord = 0;

  const parse = (
    stripped: string,
  ): { fsDirs: string[]; base: string } | null => {
    const pn = pathNoExt(stripped);
    const parts = pn.split("/").filter(Boolean);
    if (!parts.length) return null;
    return {
      fsDirs: parts.slice(0, -1),
      base: parts[parts.length - 1]!.toLowerCase(),
    };
  };

  for (const { rawKey, sk, modIn } of rows) {
    if (/\.(ts|js)$/i.test(sk) && /_middleware\.(ts|js)$/i.test(sk)) continue;
    if (/\.(ts|js)$/i.test(sk) && /_redirect\.(ts|js)$/i.test(sk)) continue;

    const p = parse(sk);
    if (!p) continue;
    if (!PAGE_EXT.test(sk)) continue;

    const { fsDirs, base } = p;
    const pn = pathNoExt(sk);

    if (base === LAYOUT_BASENAME) {
      const n = trieEnsure(root, fsDirs);
      if (
        n.layout !== undefined &&
        n.layout.rawKey !== rawKey &&
        options.silent !== true
      ) {
        console.warn(
          `[vue-nnn-router] Duplicate _layout.vue in folder, keeping "${n.layout.rawKey}".`,
        );
      } else if (n.layout === undefined) {
        n.layout = { rawKey, modIn, pathNoExt: pn };
      }
      continue;
    }

    const n = trieEnsure(root, fsDirs);
    const existing = n.pages.get(base);
    if (existing && existing.rawKey !== rawKey && options.silent !== true) {
      console.warn(`[vue-nnn-router] Duplicate basename in folder: "${base}".`);
      continue;
    }
    if (!existing) {
      n.pages.set(base, {
        basenameLc: base,
        rawKey,
        modIn,
        pathNoExt: pn,
        order: ord++,
      });
    }
  }

  const redirectSeen = new Map<string, string>();
  for (const { rawKey, sk, modIn } of rows) {
    if (!isRedirectKey(sk)) continue;
    const dir = redirectDirFromNormKey(sk);
    const fsDirs = dir ? dir.split("/").filter(Boolean) : [];
    const n = trieEnsure(root, fsDirs);
    const prev = redirectSeen.get(dir);
    if (prev !== undefined && prev !== rawKey && options.silent !== true) {
      console.warn(`[vue-nnn-router] Duplicate _redirect for "${dir || "/"}".`);
    }
    redirectSeen.set(dir, rawKey);
    if (
      n.redirect !== undefined &&
      n.redirect.rawKey !== rawKey &&
      options.silent !== true
    ) {
      console.warn(
        `[vue-nnn-router] Duplicate _redirect in folder, keeping "${n.redirect.rawKey}".`,
      );
    } else if (n.redirect === undefined) {
      n.redirect = { rawKey, modIn, pathNoExt: pathNoExt(sk) };
    }
    if (!n.layout && options.silent !== true) {
      console.warn(
        `[vue-nnn-router] _redirect "${rawKey}" has no _layout in the same folder — skipped when building routes.`,
      );
    }
  }

  const cfg: Cfg = { mwMap, pf: pf, sq: { seq: 0 }, silent: options.silent };

  let top: Built[] = [];

  if (root.layout) {
    const rootAbs = normalizePath(pathFromSegments([], pf) || "/");
    top = [
      {
        path: rootAbs,
        component: toCmp(root.layout.modIn),
        children: childrenInsideLayout(root, [], cfg),
        name: "root-layout",
        _dyn: 0,
        _abs: rootAbs,
        _fk: root.layout.rawKey,
        _order: cfg.sq.seq++,
      } as Built,
    ];
  } else {
    const acc: Built[] = [];
    for (const [, pg] of [...root.pages.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      if (pg.basenameLc !== LAYOUT_BASENAME) {
        const h =
          pg.basenameLc === "index"
            ? absHref([], pf)
            : absHref([segmentUrlFromFs(pg.basenameLc)], pf);
        acc.push(makeLeaf(h, h, pg, mwMap, cfg.sq));
      }
    }

    for (const [fs, cn] of [...root.dirs.entries()].sort((a, b) =>
      cmpFs(a[0], b[0]),
    )) {
      if (cn.layout) {
        const mount = [segmentUrlFromFs(fs)];
        const pTop = normalizePath(absHref(mount, pf));
        acc.push({
          path: pTop,
          component: toCmp(cn.layout!.modIn),
          children: childrenInsideLayout(cn, mount, cfg),
          name: `${nm(pTop)}-layout`,
          meta: {},
          _dyn: dynamicScore(pTop),
          _abs: pTop,
          _fk: cn.layout!.rawKey,
          _order: cfg.sq.seq++,
        } as Built);
      } else acc.push(...emitFlatTopSubtree(cn, [fs], cfg));
    }
    top = acc;
  }

  const leavesKeep = new Map<string, Built>();
  const flatLeaves: Built[] = [];
  collectLeaves(top, flatLeaves);
  const bucket = new Map<string, Built[]>();
  for (const lf of flatLeaves) {
    const ax = lf._abs;
    const b = bucket.get(ax);
    if (b) b.push(lf);
    else bucket.set(ax, [lf]);
  }
  const mode = options.onDuplicate === "last-wins" ? "last" : "first";
  const silent = options.silent === true;
  const strat = options.onDuplicate;
  const dupEntries = [...bucket.entries()].filter(([, a]) => a.length > 1);
  if (dupEntries.length && !silent && typeof strat !== "function") {
    for (const [p, arr] of dupEntries) {
      console.warn(
        `[vue-nnn-router] Duplicate URL "${p}": ${arr.map((x) => x._fk).join(", ")}`,
      );
    }
  }
  if (typeof strat === "function") {
    for (const [p, arr] of dupEntries) strat(p, arr.map((x) => x._fk));
  }

  for (const [, arr] of bucket) {
    const srt = [...arr].sort((a, b) => a._order - b._order);
    const win = mode === "last" ? srt[srt.length - 1]! : srt[0]!;
    leavesKeep.set(win._abs, win);
  }

  top = pruneTree(top, leavesKeep);

  top = top.sort((a, b) => String(a.path).localeCompare(String(b.path)));

  if (options.verbose === true && logFn) {
    const afterLeaves: Built[] = [];
    collectLeaves(top, afterLeaves);
    logFn(formatSpaVerbose(afterLeaves));
  }

  return finalizeTree(top);
}

function formatSpaVerbose(leaves: Built[]): string {
  const rows = leaves.map((l) => ({
    Path: l._abs,
    File: l._fk,
  }));
  if (!rows.length) return "";
  const wPath = Math.max(4, ...rows.map((x) => x.Path.length));
  const wFile = Math.max(4, ...rows.map((x) => x.File.length));
  const ln = "-".repeat(wPath + wFile + 3);
  const h = `Path`.padEnd(wPath) + "  " + `File`.padEnd(wFile);
  const b = rows.map((r) => r.Path.padEnd(wPath) + "  " + r.File.padEnd(wFile)).join("\n");
  return ["[vue-nnn-router]", ln, h, ln, b, ln].join("\n");
}
