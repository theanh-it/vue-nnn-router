/** Per-page scroll config — namespaced under `meta.nnnScroll` to avoid clashes. */
export interface NnnScrollMeta {
  /** `false` skips scrolling for this page (overrides global). */
  enabled?: boolean;
  /** Smooth animation instead of an instant jump. */
  smooth?: boolean;
  /** Offset in px from the top (e.g. a sticky header height). */
  top?: number;
  /** Horizontal offset in px. */
  left?: number;
  /** Scroll to the `to.hash` anchor element when present. */
  scrollToHash?: boolean;
  /** Restore the previous scroll position on Back/Forward. */
  restorePosition?: boolean;
}

/** Map `nnnFile` key (see `simplifyGlobKey`) → per-page scroll config. */
export type NnnScrollMap = Record<string, NnnScrollMeta>;

/** Normalize the `defineNnnScroll` argument to an `NnnScrollMeta` object. */
export function normalizeNnnScroll(
  options: NnnScrollMeta | boolean,
): NnnScrollMeta {
  return typeof options === "boolean" ? { enabled: options } : { ...options };
}

/**
 * Declare per-page scroll behavior. Call it bare in `<script setup>`:
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { defineNnnScroll } from "vue-nnn-router";
 * defineNnnScroll({ top: 80, smooth: true });
 * </script>
 * ```
 *
 * The `vueNnnRouterScrollPlugin` extracts this call at build time and injects
 * the config into the route's `meta.nnnScroll` (keyed by the page file). The
 * runtime call itself is a no-op that simply returns the normalized config, so
 * the same value can also be spread into a manual `meta` when not using the
 * plugin: `meta: { ...toNnnScrollMeta(defineNnnScroll({ top: 80 })) }`.
 */
export function defineNnnScroll(
  options: NnnScrollMeta | boolean,
): NnnScrollMeta {
  return normalizeNnnScroll(options);
}

/** Wrap a config into the `{ nnnScroll }` meta fragment for manual `meta` use. */
export function toNnnScrollMeta(
  options: NnnScrollMeta | boolean,
): { nnnScroll: NnnScrollMeta } {
  return { nnnScroll: normalizeNnnScroll(options) };
}
