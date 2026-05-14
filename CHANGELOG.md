# Changelog

**Versioning:** while in **`0.x`** the package is in early development and breaking changes may occur in any minor release. Starting from **`1.0.0`**, this package will use **semver major aligned with Vue Router** — **`vue-nnn-router` 4.x** will target **Vue Router 4.x**, and when Vue Router 5 exists, expect **`vue-nnn-router` 5.x** with a Vue Router 5 peer.

## [0.0.1] - 2026-05-14

Initial public release.

- SPA file-based routing: `index.vue`, `_layout.vue`, dynamic `[param]` and `[param].vue`.
- Cascading `_middleware.ts` and optional per-route `middleware` export (eager glob).
- Helpers: `simplifyGlobKey`, `pathNoExt`, `segmentUrlFromFs`, `mwPrefixesForPathNoExt`.

[0.0.1]: https://www.npmjs.com/package/vue-nnn-router/v/0.0.1
