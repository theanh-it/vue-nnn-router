# Changelog

**Versioning:** while in **`0.x`** the package is in early development and breaking changes may occur in any minor release. Starting from **`1.0.0`**, this package will use **semver major aligned with Vue Router** — **`vue-nnn-router` 4.x** will target **Vue Router 4.x**, and when Vue Router 5 exists, expect **`vue-nnn-router` 5.x** with a Vue Router 5 peer.

## [0.0.6] - 2026-07-30

### Fixed

- Keep `routesRoot`, `prefix`, and `silent` optional in the public `vueNnnRouterNamesPlugin` options type.
- Smoke-test the ESM and CJS exports of `vueNnnRouterScrollPlugin`.

## [0.0.5] - 2026-07-25

### Added

- **`createNnnScrollBehavior`** — a Vue Router `scrollBehavior` factory: scroll to top on navigation with optional `smooth` animation, saved-position restore on Back/Forward, `to.hash` anchor support, a `top` offset, and a per-route `meta` opt-out (`skipMetaKey`, default `"noScroll"`).
- **`defineNnnScroll`** — declare per-page scroll config with a single call in `<script setup>` (e.g. `defineNnnScroll({ top: 80, smooth: true })` or `defineNnnScroll(false)`). Paired with the new **`vueNnnRouterScrollPlugin`** (from `vue-nnn-router/vite`), which extracts each call at dev/build time into a `router-scroll.ts` map; pass it to `createNnnScrollBehavior({ scrollMap })`. Config is stored under the namespaced `meta.nnnScroll` to avoid clashes. Also exports `toNnnScrollMeta`, `normalizeNnnScroll`, and the `NnnScrollMeta` / `NnnScrollMap` types. `createNnnScrollBehavior` gains `scrollMap` and `left` options, with per-page config merged over globals.

## [0.0.4] - 2026-07-17

### Fixed

- Point the **`vue-nnn-router/vite`** type export to the declaration file emitted by TypeScript.
- Regenerate `ROUTER_NAME` during HMR for any folder matched by the configured `pages` globs, not only folders named `pages`.
- Eager-load the demo page that exposes per-route `middleware`, so the demo matches the documented lazy-loading limitation.

### Changed

- Build and smoke-test package exports during `npm pack`, including ESM, CJS and TypeScript consumer resolution.

## [0.0.3] - 2026-06-05

### Added

- **`ROUTER_NAME` codegen:** `collectRouteNames`, `routeNameToCamelKey`, `formatRouterNameModule`, `createNnnRoutesWithNames`.
- **Vite plugin** `vueNnnRouterNamesPlugin` (`vue-nnn-router/vite`) — writes `router-name.ts` (default path) with camelCase keys at dev/build.
- **`createNnnModules`** — merge lazy page glob + eager `_middleware` / `_redirect` sidecars.
- **`warnIfEagerPages`**, **`isLazyGlobModule`**, **`isEagerPageModule`**.
- Constants **`NNN_LAZY_VIEW_GLOBS`**, **`NNN_EAGER_SIDECAR_GLOBS`**.
- Docs: auto-generated `route.name`, `ROUTER_NAME`, and lazy glob usage.
- Demo: lazy pages, `settings`/`admin` `_redirect`, `router-name.ts`.

## [0.0.2] - 2026-06-05

### Added

- Export `isRedirectKey` and `redirectDirFromNormKey` helpers.
- npm package metadata (`repository`, `homepage`, `bugs`).

### Changed

- Runtime warnings and errors are now in English.
- README: `_redirect` + `prefix` guidance; updated taglines and exported helpers list.

### Fixed

- Demo `users/add.vue` middleware no longer redirects away from `/users/add`.

## [0.0.1] - 2026-06-05

Initial public release.

- SPA file-based routing: `index.vue`, `_layout.vue`, `_redirect.ts`, dynamic `[param]` and `[param].vue`.
- `_redirect.ts`: when a layout folder has no `index.*`, inject `{ path: "", redirect }` (relative or absolute URL).
- Cascading `_middleware.ts` and optional per-route `middleware` export (eager glob).
- Helpers: `simplifyGlobKey`, `pathNoExt`, `segmentUrlFromFs`, `mwPrefixesForPathNoExt`.

[0.0.6]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.6
[0.0.5]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.5
[0.0.4]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.4
[0.0.3]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.3
[0.0.2]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.2
[0.0.1]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.1
