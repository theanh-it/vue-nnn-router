import { simplifyGlobKey, unwrapDefault } from "./globUtils";
import { isMiddlewareKey, isRedirectKey } from "./path";

export type WarnIfEagerPagesOptions = {
  silent?: boolean;
  logger?: (...args: unknown[]) => void;
};

const PAGE_EXT = /\.(vue|tsx|jsx)$/i;

function isPageViewKey(key: string): boolean {
  const n = key.replace(/\\/g, "/").split("?")[0];
  if (!PAGE_EXT.test(n)) return false;
  if (/_middleware\.(ts|js)$/i.test(n)) return false;
  if (/_redirect\.(ts|js)$/i.test(n)) return false;
  return true;
}

function isSidecarKey(key: string): boolean {
  const sk = simplifyGlobKey(key);
  return isMiddlewareKey(sk) || isRedirectKey(sk);
}

/** `import.meta.glob` lazy entry: `() => import(...)`. */
export function isLazyGlobModule(mod: unknown): boolean {
  return typeof mod === "function" && unwrapDefault(mod) === mod;
}

/** Page/layout `.vue` (etc.) loaded eagerly — resolved module object or sync import. */
export function isEagerPageModule(key: string, mod: unknown): boolean {
  if (!isPageViewKey(key)) return false;
  return !isLazyGlobModule(mod);
}

/**
 * Warn when every page/view in the map is eager (typical `import.meta.glob(..., { eager: true })`).
 * Lazy loading is recommended for large apps (e.g. separate user/admin zones).
 */
export function warnIfEagerPages(
  modules: Record<string, unknown>,
  options: WarnIfEagerPagesOptions = {},
): void {
  if (options.silent === true) return;

  const log = options.logger ?? console.warn;
  const pageEntries = Object.entries(modules).filter(([k]) => isPageViewKey(k));

  if (pageEntries.length > 0) {
    const eagerPages = pageEntries.filter(([k, mod]) => isEagerPageModule(k, mod));
    if (eagerPages.length === pageEntries.length) {
      log(
        `[vue-nnn-router] All ${eagerPages.length} page module(s) are eager-loaded. ` +
          `For route-level code splitting, use lazy import.meta.glob for *.vue (see createNnnModules).`,
      );
    }
  }

  for (const [key, mod] of Object.entries(modules)) {
    if (!isSidecarKey(key)) continue;
    if (isLazyGlobModule(mod)) {
      log(
        `[vue-nnn-router] Sidecar "${key}" should be eager-loaded (_middleware / _redirect). ` +
          `Merge an eager glob or use createNnnModules().`,
      );
    }
  }
}

export type CreateNnnModulesOptions = {
  /** Lazy page map from `import.meta.glob` (no `{ eager: true }`). */
  views: Record<string, unknown>;
  /**
   * Eager sidecars — `_middleware.ts`, `_redirect.ts`, or page modules that export `middleware`.
   * Later keys override `views` for the same path.
   */
  eager?: Record<string, unknown>;
  silent?: boolean;
  logger?: (...args: unknown[]) => void;
};

/**
 * Merge lazy `views` with eager `eager` sidecars and run eager-page warnings.
 * Call `import.meta.glob` in your router file, then pass maps here.
 */
export function createNnnModules(
  options: CreateNnnModulesOptions,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...options.views,
    ...(options.eager ?? {}),
  };
  warnIfEagerPages(merged, {
    silent: options.silent,
    logger: options.logger,
  });
  return merged;
}

/** Suggested eager glob patterns for `_middleware.ts` and `_redirect.ts`. */
export const NNN_EAGER_SIDECAR_GLOBS = [
  "**/_middleware.ts",
  "**/_middleware.js",
  "**/_redirect.ts",
  "**/_redirect.js",
] as const;

/** Suggested lazy glob patterns for pages and layouts. */
export const NNN_LAZY_VIEW_GLOBS = [
  "**/*.vue",
  "**/*.tsx",
  "**/*.jsx",
] as const;
