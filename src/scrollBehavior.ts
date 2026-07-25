import type { RouterScrollBehavior } from "vue-router";
import type { NnnScrollMap, NnnScrollMeta } from "./scrollMeta";
import { simplifyGlobKey } from "./globUtils";

export interface NnnScrollBehaviorOptions {
  /** Smooth scrolling instead of an instant jump. Default: false. */
  smooth?: boolean;
  /**
   * Restore the previous scroll position on browser Back/Forward
   * (the `savedPosition` provided by Vue Router). Default: true.
   */
  restorePosition?: boolean;
  /** Scroll to the `to.hash` anchor element when present. Default: true. */
  scrollToHash?: boolean;
  /**
   * Skip scrolling when `route.meta[skipMetaKey]` is truthy.
   * Set to `false` to disable the opt-out entirely. Default: "noScroll".
   */
  skipMetaKey?: string | false;
  /** Offset in px from the top (e.g. a sticky header height). Default: 0. */
  top?: number;
  /** Horizontal offset in px. Default: 0. */
  left?: number;
  /**
   * Per-page overrides keyed by page file (from `vueNnnRouterScrollPlugin`).
   * A page's own config wins over these global defaults.
   */
  scrollMap?: NnnScrollMap;
}

type Resolved = {
  smooth: boolean;
  restorePosition: boolean;
  scrollToHash: boolean;
  top: number;
  left: number;
};

function perPageMeta(
  meta: Record<string, unknown> | undefined,
  scrollMap: NnnScrollMap | undefined,
): NnnScrollMeta | undefined {
  const inline = meta?.nnnScroll as NnnScrollMeta | undefined;
  if (inline) return inline;
  if (!scrollMap) return undefined;
  const file = meta?.nnnFile;
  if (typeof file !== "string") return undefined;
  return scrollMap[simplifyGlobKey(file)];
}

function merge(base: Resolved, over: NnnScrollMeta | undefined): Resolved {
  if (!over) return base;
  return {
    smooth: over.smooth ?? base.smooth,
    restorePosition: over.restorePosition ?? base.restorePosition,
    scrollToHash: over.scrollToHash ?? base.scrollToHash,
    top: over.top ?? base.top,
    left: over.left ?? base.left,
  };
}

/**
 * Build a Vue Router `scrollBehavior` that scrolls to the top on navigation,
 * with optional smooth animation, saved-position restore, hash anchors, and a
 * per-route `meta` opt-out.
 *
 * Per-page config declared with `defineNnnScroll(...)` (extracted by
 * `vueNnnRouterScrollPlugin` into `scrollMap`) or set directly on
 * `meta.nnnScroll` overrides these global defaults.
 *
 * @example
 * const router = createRouter({
 *   history: createWebHistory(),
 *   routes,
 *   scrollBehavior: createNnnScrollBehavior({ smooth: true, scrollMap: NNN_SCROLL }),
 * });
 */
export function createNnnScrollBehavior(
  options: NnnScrollBehaviorOptions = {},
): RouterScrollBehavior {
  const {
    smooth = false,
    restorePosition = true,
    scrollToHash = true,
    skipMetaKey = "noScroll",
    top = 0,
    left = 0,
    scrollMap,
  } = options;

  const base: Resolved = { smooth, restorePosition, scrollToHash, top, left };

  return (to, _from, savedPosition) => {
    if (skipMetaKey && to.meta?.[skipMetaKey]) return false;

    const page = perPageMeta(to.meta as Record<string, unknown>, scrollMap);
    if (page?.enabled === false) return false;

    const cfg = merge(base, page);
    // DOM ScrollBehavior only accepts "auto" | "smooth".
    const behavior: ScrollBehavior = cfg.smooth ? "smooth" : "auto";

    if (cfg.restorePosition && savedPosition) {
      return { ...savedPosition, behavior };
    }

    if (cfg.scrollToHash && to.hash) {
      return { el: to.hash, top: cfg.top, behavior };
    }

    return { top: cfg.top, left: cfg.left, behavior };
  };
}
