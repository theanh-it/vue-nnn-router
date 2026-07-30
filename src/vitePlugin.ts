import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createFilter, type Plugin } from "vite";
import { globSync } from "tinyglobby";
import type { CreateNnnRoutesOptions } from "./types";
import { createSpaNnnRoutes } from "./spaRoutes";
import {
  collectRouteNames,
  formatRouterNameModule,
} from "./routeNames";
import { simplifyGlobKey } from "./globUtils";
import { extractNnnScroll, formatScrollMapModule } from "./scrollExtract";
import type { NnnScrollMap } from "./scrollMeta";

export type VueNnnRouterNamesPluginOptions = {
  /** Project root (default: Vite config root). */
  root?: string;
  /** Glob patterns for page files (relative to `root`), same coverage as `import.meta.glob`. */
  pages: string | string[];
  /** Output file path relative to `root` (default: `src/router/router-name.ts`). */
  outFile?: string;
  /** Prefix removed from page glob keys before routes are generated. */
  routesRoot?: CreateNnnRoutesOptions["routesRoot"];
  /** URL path prefix applied to generated routes. */
  prefix?: CreateNnnRoutesOptions["prefix"];
  /** Suppress route-generation warnings (default: `true`). */
  silent?: CreateNnnRoutesOptions["silent"];
};

function normalizeGlobKey(file: string): string {
  let k = file.replace(/\\/g, "/");
  while (k.startsWith("./")) k = k.slice(2);
  return k;
}

function modulesFromGlobFiles(files: string[]): Record<string, unknown> {
  const modules: Record<string, unknown> = {};
  for (const f of files) {
    const key = normalizeGlobKey(f);
    if (/_redirect\.(ts|js)$/i.test(key)) {
      /** Placeholder — route `name` only; real target comes from the app glob at runtime. */
      modules[key] = { default: "index" };
    } else {
      modules[key] = {};
    }
  }
  return modules;
}

export function generateRouterNameFile(
  options: VueNnnRouterNamesPluginOptions & { root: string },
): void {
  const patterns = Array.isArray(options.pages) ? options.pages : [options.pages];
  const files = globSync(patterns, { cwd: options.root, onlyFiles: true });
  const modules = modulesFromGlobFiles(files);
  const routes = createSpaNnnRoutes(modules, {
    routesRoot: options.routesRoot,
    prefix: options.prefix,
    silent: options.silent ?? true,
  });
  const names = collectRouteNames(routes, { silent: options.silent ?? true });
  const outFile = options.outFile ?? "src/router/router-name.ts";
  const content = formatRouterNameModule(names);
  const outPath = resolve(options.root, outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, "utf8");
}

function normalizeFilterPattern(pattern: string): string {
  let p = pattern.replace(/\\/g, "/");
  while (p.startsWith("./")) p = p.slice(2);
  return p.replace(/^\/+/, "");
}

function createPagesFilter(
  pages: string | string[],
  root: string,
): (file: string) => boolean {
  const patterns = Array.isArray(pages) ? pages : [pages];
  const include: string[] = [];
  const exclude: string[] = [];

  for (const rawPattern of patterns) {
    const negated = rawPattern.startsWith("!");
    const pattern = normalizeFilterPattern(
      negated ? rawPattern.slice(1) : rawPattern,
    );
    if (!pattern) continue;
    (negated ? exclude : include).push(pattern);
  }

  return createFilter(include, exclude, { resolve: root });
}

/** Vite plugin — writes `router-name.ts` (default) with camelCase keys at dev/build time. */
export function vueNnnRouterNamesPlugin(
  options: VueNnnRouterNamesPluginOptions,
): Plugin {
  let viteRoot = options.root ?? process.cwd();
  let isPageFile = createPagesFilter(options.pages, viteRoot);

  const run = () => {
    generateRouterNameFile({ ...options, root: viteRoot });
  };

  return {
    name: "vue-nnn-router-names",
    configResolved(config) {
      viteRoot = options.root ?? config.root;
      isPageFile = createPagesFilter(options.pages, viteRoot);
    },
    buildStart() {
      run();
    },
    configureServer() {
      run();
    },
    handleHotUpdate(ctx) {
      if (isPageFile(ctx.file)) {
        run();
        return ctx.modules;
      }
    },
  };
}

export type VueNnnRouterScrollPluginOptions = {
  /** Project root (default: Vite config root). */
  root?: string;
  /** Glob patterns for page files (relative to `root`). */
  pages: string | string[];
  /** Output file path relative to `root` (default: `src/router/router-scroll.ts`). */
  outFile?: string;
  /** Silence warnings about arguments that could not be statically evaluated. */
  silent?: boolean;
};

/** Scan page files and build `{ "src/pages/foo.vue": { top: 80 }, … }`. */
export function buildScrollMap(
  options: VueNnnRouterScrollPluginOptions & { root: string },
): NnnScrollMap {
  const patterns = Array.isArray(options.pages) ? options.pages : [options.pages];
  const files = globSync(patterns, { cwd: options.root, onlyFiles: true });
  const map: NnnScrollMap = {};
  for (const file of files.sort()) {
    let code: string;
    try {
      code = readFileSync(resolve(options.root, file), "utf8");
    } catch {
      continue;
    }
    if (!code.includes("defineNnnScroll")) continue;
    const cfg = extractNnnScroll(code);
    if (cfg) {
      map[simplifyGlobKey(file)] = cfg;
    } else if (options.silent !== true) {
      console.warn(
        `[vue-nnn-router] Could not statically read defineNnnScroll(...) in "${file}" ` +
          `(use an object/boolean literal, not variables or expressions).`,
      );
    }
  }
  return map;
}

/** Write `router-scroll.ts` exporting the `NNN_SCROLL` map. */
export function generateRouterScrollFile(
  options: VueNnnRouterScrollPluginOptions & { root: string },
): void {
  const map = buildScrollMap(options);
  const outFile = options.outFile ?? "src/router/router-scroll.ts";
  const outPath = resolve(options.root, outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, formatScrollMapModule(map), "utf8");
}

/**
 * Vite plugin — extracts `defineNnnScroll(...)` from each page at dev/build time
 * and writes a `router-scroll.ts` map. Pass the exported `NNN_SCROLL` to
 * `createNnnScrollBehavior({ scrollMap: NNN_SCROLL })`.
 */
export function vueNnnRouterScrollPlugin(
  options: VueNnnRouterScrollPluginOptions,
): Plugin {
  let viteRoot = options.root ?? process.cwd();
  let isPageFile = createPagesFilter(options.pages, viteRoot);

  const run = () => {
    generateRouterScrollFile({ ...options, root: viteRoot });
  };

  return {
    name: "vue-nnn-router-scroll",
    configResolved(config) {
      viteRoot = options.root ?? config.root;
      isPageFile = createPagesFilter(options.pages, viteRoot);
    },
    buildStart() {
      run();
    },
    configureServer() {
      run();
    },
    handleHotUpdate(ctx) {
      if (isPageFile(ctx.file)) {
        run();
        return ctx.modules;
      }
    },
  };
}
