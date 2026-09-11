/** Per-page configuration for the Lenis-powered smooth-scroll controller. */
export interface NnnSmoothScrollMeta {
  /** Enable or disable continuous smooth scrolling for this page. */
  enabled?: boolean;
  /** Disable smooth scrolling on mobile for this page. */
  disableOnMobile?: boolean;
}

/** Map `nnnFile` key (see `simplifyGlobKey`) to per-page smooth-scroll config. */
export type NnnSmoothScrollMap = Record<string, NnnSmoothScrollMeta>;

export function normalizeNnnSmoothScroll(
  options: NnnSmoothScrollMeta | boolean,
): NnnSmoothScrollMeta {
  return typeof options === "boolean" ? { enabled: options } : { ...options };
}

/**
 * Declare continuous smooth scrolling for one page. The Vite plugin extracts
 * this call at build time, so its argument must be an object/boolean literal.
 *
 * @example
 * defineNnnSmoothScroll(false); // native scrolling on this page
 * defineNnnSmoothScroll({ enabled: true, disableOnMobile: true });
 */
export function defineNnnSmoothScroll(
  options: NnnSmoothScrollMeta | boolean,
): NnnSmoothScrollMeta {
  return normalizeNnnSmoothScroll(options);
}

/** Wrap a config into the `{ nnnSmoothScroll }` fragment for manual route meta. */
export function toNnnSmoothScrollMeta(
  options: NnnSmoothScrollMeta | boolean,
): { nnnSmoothScroll: NnnSmoothScrollMeta } {
  return { nnnSmoothScroll: normalizeNnnSmoothScroll(options) };
}
