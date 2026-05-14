export function normalizePath(path: string): string {
  const cleaned = path.replace(/\/+/g, "/").replace(/\/$/, "");
  if (cleaned === "" || cleaned === "/") return "/";
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

/** Bỏ `routesRoot/` khỏi key đã qua simplifyGlobKey. */
export function stripRoutesRoot(normKey: string, routesRoot?: string): string {
  const k0 = normKey.replace(/\\/g, "/").split("?")[0];
  let rRaw = routesRoot?.replace(/\\/g, "/").replace(/^\.\/+/, "") ?? "";
  rRaw = rRaw.replace(/^\/+|\/+$/g, "");
  if (!rRaw) return k0;
  const p = `${rRaw}/`;
  if (k0 === rRaw || k0 === `${rRaw}/`) return "";
  if (k0.startsWith(p)) return k0.slice(p.length);
  return k0;
}

export function pathFromSegments(segments: string[], prefix?: string): string {
  const core = segments.length === 0 ? "" : `/${segments.join("/")}`;
  const raw = [prefix?.replace(/^\/|\/$/g, ""), core.replace(/^\//, "")]
    .filter(Boolean)
    .join("/");
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return normalizePath(withSlash);
}

export function isMiddlewareKey(key: string): boolean {
  const n = key.replace(/\\/g, "/").split("?")[0];
  return /^(.+\/)?_middleware\.(ts|js)$/i.test(n);
}

/** Thư mục chứa `_middleware` (chuỗi rỗng = ngay trong `routesRoot`). */
export function middlewareDirFromNormKey(normKey: string): string {
  const n = normKey.replace(/\\/g, "/").split("?")[0];
  const nested = /^(.*?)\/_middleware\.(ts|js)$/i.exec(n);
  if (nested) return nested[1]!;
  if (/^_middleware\.(ts|js)$/i.test(n)) return "";
  return "";
}

export function middlewareLogicalKey(prefixPath: string): string {
  return `${prefixPath}/_middleware`;
}

/** Đếm độ động (số `/:`) để ưu tiên route tĩnh trước. */
export function dynamicScore(pathPattern: string): number {
  return (pathPattern.match(/\/:/g) || []).length;
}
