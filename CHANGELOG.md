# Changelog

**Versioning:** while in **`0.x`** the package is in early development and breaking changes may occur in any minor release. Starting from **`1.0.0`**, this package will use **semver major aligned with Vue Router** — **`vue-nnn-router` 4.x** will target **Vue Router 4.x**, and when Vue Router 5 exists, expect **`vue-nnn-router` 5.x** with a Vue Router 5 peer.

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

[0.0.3]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.3
[0.0.2]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.2
[0.0.1]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.1
