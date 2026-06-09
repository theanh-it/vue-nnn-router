# vue-nnn-router

File-based routing for **[Vue Router](https://router.vuejs.org/)** (**4.x** or **5.x**): **SPA-style** pages (`index.vue`, optional **`_layout.vue`** and **`_redirect.ts`** per folder), dynamic segments **`[param]` → `:param`**, cascading **`_middleware.ts`**, powered by a Vite **`import.meta.glob`** map (or any equivalent `Record<string, unknown>`).

**English** | [Tiếng Việt](README.vi.md)

## Contents

1. [Why glob, not filesystem?](#why-glob-not-filesystem)
2. [Install & requirements](#install--requirements)
3. [Quick start](#quick-start)
4. [Folder layout & URL mapping](#folder-layout--url-mapping)
5. [Glob patterns and `routesRoot`](#glob-patterns-and-routesroot) — three common setups
6. [`createNnnRoutes` options (with examples)](#creatennroutes-options-with-examples)
7. [Middleware (directory + per-route)](#middleware-directory--per-route)
8. [Eager vs lazy `import.meta.glob`](#eager-vs-lazy-importmetaglob)
9. [Route meta & utilities](#route-meta--utilities)
10. [Run the demo](#run-the-demo-this-repo)
11. [Package & license](#package)

## Why glob, not filesystem?

There is no usable filesystem API inside the browser bundle for your route tree, so this library turns a **glob map** (resolved at build time) into **`RouteRecordRaw[]`**.

## Install & requirements

```bash
npm install vue-nnn-router
```

- **Vue** `^3.3` (with **Vue Router 5**, follow that release’s peer: typically **Vue `^3.5`**).
- **Vue Router** `^4.2` **or** `^5.0` — this package only builds plain **`RouteRecordRaw[]`** and **`beforeEnter`** guards compatible with both lines.
- **Vite** `import.meta.glob` (or any object shaped like the glob result)

Guards exported from **`_middleware.ts`** and per-route **`middleware`** use the same **`next()` callback style** Vue Router accepts on both majors; Vue Router **5 may log deprecations** encouraging return-based guards — behavior is unchanged for your users until they refactor.

## Quick start

**1. Put pages under `src/pages/`** (recommended name; any folder works).

**2. Build a module map and call `createNnnRoutes`:**

```ts
// e.g. src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { createNnnRoutes } from "vue-nnn-router";

const modules = import.meta.glob(
  [
    "/src/pages/**/*.{vue,tsx,jsx,ts,js}",
    "/src/pages/**/_middleware.ts",
  ],
  { eager: true },
);

const routes = createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

**3. Mount the router** in `main.ts` as usual.

## Folder layout & URL mapping

```
pages/
  _middleware.ts           # applies to all pages under pages/
  index.vue                # URL /
  about/
    index.vue              # /about
  users/
    _layout.vue            # layout for /users/** — must render <RouterView />
    _middleware.ts
    _redirect.ts           # (optional) redirect /users when there is no index.vue
    index.vue              # /users
    add.vue                # /users/add
    [id].vue               # /users/:id (shorthand; same idea as users/[id]/index.vue)
```

- **Allowed extensions:** `.vue`, `.tsx`, `.jsx`, `.ts`, `.js`.
- **`index.*`:** index URL for that folder.
- **Other basenames (`add.vue`, …):** one more segment in the URL.
- **`[param].*` or `[param]/` folders:** **`[id]` → `:id`** in the URL.
- **`_layout.vue`:** wraps child routes (same **`_`** prefix rule as **`_middleware.ts`**); nested views need **`<RouterView />`**.
- **`_redirect.ts`:** when a folder has **`_layout`** but **no** **`index.*`**, the library injects `{ path: "", redirect: "..." }`. `export default` is an absolute URL (`"/users/add"`) or a relative segment (`"add"`). If **`index.*`** exists, **`_redirect` is ignored**.

## Glob patterns and `routesRoot`

Keys in the glob object must be normalized consistently: this library runs each key through **`simplifyGlobKey`** (drops leading `./`, drops a single leading **`/`**) and then **`stripRoutesRoot`** when you pass **`routesRoot`**.

You must pass **`routesRoot`** exactly matching the prefix of those normalized keys — the part **before** the path that drives the route tree (`about/index.vue`, `users/[id].vue`, …).

### Case A — Root-relative glob (recommended)

Pattern starts with **`/`** → resolved from the Vite **project root** (folder that contains **`vite.config`**).

```ts
const modules = import.meta.glob(
  [
    "/src/pages/**/*.{vue,tsx,jsx,ts,js}",
    "/src/pages/**/_middleware.ts",
  ],
  { eager: true },
);

createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
});
```

Keys look like **`src/pages/about/index.vue`** → strip **`src/pages`** → **`about/index.vue`**.

### Case B — Relative to the file that calls `import.meta.glob`

Useful when you keep **`src/router/index.ts`** next to **`src/pages/`**:

```ts
const modules = import.meta.glob(
  [
    "../pages/**/*.{vue,tsx,jsx,ts,js}",
    "../pages/**/_middleware.ts",
  ],
  { eager: true },
);

createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "../pages",
});
```

Keys look like **`../pages/about/index.vue`**.

### Case C — Manual map, no strip

If **you omit `routesRoot`**, normalized keys must already be rooted at the routing tree (**no stray `src/pages` prefix**). Handy for tests or codegen.

```ts
createNnnRoutes(
  {
    "about/index.vue": { default: AboutPage },
    "index.vue": { default: HomePage },
  } as Record<string, unknown>,
  {
    /** no routesRoot — keys ARE the tree paths after normalize */
  },
);
```

❌ Typical mistake: **`routesRoot: "pages"`** while using **`Case A`** — keys become **`src/pages/...`**; the prefix **`pages`** alone does **not** match. Prefer **`routesRoot: "src/pages"`** or switch to **`Case B`**.

---

## `createNnnRoutes` options (with examples)

| Option          | Purpose |
|----------------|---------|
| `routesRoot`   | Strip filesystem prefix from each glob key (after `simplifyGlobKey`). |
| `prefix`       | Leading URL segment for **all** generated paths. |
| `onDuplicate`  | Two files resolving to the same URL path. |
| `verbose`      | Print path ↔ source file table after build. |
| `logger`       | Custom printer for **`verbose`** (defaults to **`console.log`**). |
| `silent`       | Suppress warnings and disable **`verbose`** output. |

**Default duplicate resolution:** if you do nothing, the **first** matching leaf (by stable internal ordering) wins. Set **`onDuplicate: "last-wins"`** to keep the opposite. Duplicate sets still **`console.warn`** unless **`silent: true`** or you pass a **callback** (callback replaces built-in duplicate warnings).

### `routesRoot`

Already covered above. Use **`warnIfRoutesRootLikelyWrong`** from the package export if you want to detect misaligned roots in tooling (see [Utilities](#route-meta--utilities)).

### `prefix`

Adds a stable URL segment in front of every route (**leading/trailing slashes are normalized away**):

```ts
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  prefix: "/app", // or "app"
});
```

- Page that was **`/`** becomes **`/app`** (or **`/app/`** normalized).
- **`/users`** becomes **`/app/users`**.

### `onDuplicate`: `"first-wins"` \| `"last-wins"` \| callback

When two files map to the **same URL** (for example two `index.vue` files both resolving to **`/`**).

```ts
// Keep the chronologically later file after internal ordering:
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  onDuplicate: "last-wins",
  silent: true, // omit duplicate warnings if intentional
});

// Or handle yourself (no default duplicate warning for these):
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  onDuplicate: (path, files) => {
    console.error(`Duplicate URL ${path}`, files);
  },
});
```

### `verbose` and `logger`

```ts
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  verbose: true,
  logger: (...args) => {
    // e.g. send to tooling instead of stdout
    args.forEach((a) => myTooling.log(String(a)));
  },
});
```

If **`silent: true`**, **`verbose`** has no channel (logging is disabled).

### `silent`

Turns **off**:

- Duplicate-path **`console.warn`**
- Other library warnings (`routesRoot` mismatch, duplicate middleware keys, …)
- **`verbose`** printing

---

## Middleware (directory + per-route)

### At a glance

| Goal | What to use |
|------|-------------|
| Run before **all** routes under a folder (and its subfolders) | That folder’s **`_middleware.ts`** — `export default` one guard or `export default [a, b]` |
| Run for **one URL** only | In the page module: **`export function middleware`** (or `export { … as middleware }`) — glob for that file must be **`eager`** |
| Avoid per-page `middleware` with lazy code-splitting | Keep **`_middleware.ts`** in a separate **`import.meta.glob(..., { eager: true })`** |

### File layout

Place **`_middleware.ts`** (or **`_middleware.js`**) inside a page directory. It applies to the **entire URL subtree** under that folder (including deeper pages that do not define their own `_middleware`).

```text
src/pages/
  _middleware.ts          ← root guard: every URL under pages/
  index.vue                 ← /
  users/
    _middleware.ts          ← extra guard for every URL under /users/...
    index.vue               ← /users
    add.vue                 ← /users/add
```

### Order when you navigate to a URL

Each **leaf** `RouteRecordRaw` gets a single composed **`beforeEnter`** chain. This library concatenates:

1. The **`_middleware.ts`** at the routing root (`pages/`, empty prefix),
2. Then each deeper **`_middleware.ts`** along the path (`users/`, …),
3. Finally the page module’s **`middleware`** export (if any and the module was loaded **eagerly**).

**Example:** navigating to **`/users/add`** with the tree above:

1. Default export from **`pages/_middleware.ts`**
2. Default export from **`pages/users/_middleware.ts`**
3. (If present) **`middleware`** from **`pages/users/add.vue`**

If any guard calls `next(false)`, `throw`, or redirects with `next('/somewhere')`, later steps follow normal Vue Router rules (may never run).

### `_redirect.ts` — default child when a layout has no `index`

If a folder has **`_layout.vue`** but **no** **`index.vue`**, visiting the parent URL (e.g. `/users`) renders the layout with an empty `<RouterView />`. Add **`_redirect.ts`** next to **`_layout`** and the library injects `{ path: "", redirect: "..." }`:

```ts
// src/pages/users/_redirect.ts
export default "add"; // redirects /users → /users/add

// or an absolute URL:
// export default "/users/add";
```

Include the file in your glob (`**/*.{ts,js}` or `**/_redirect.ts`, **eager**).

If **`index.*`** already exists, **`_redirect` is ignored** — `index` remains the default page.

**With `prefix`:** prefer a **relative** target (`"add"` → `/app/users/add` when `prefix: "app"`). An **absolute** path (`"/users/add"`) is used as-is and does **not** include `prefix`.

### Directory middleware — default export, single guard

```ts
// src/pages/_middleware.ts
import type {
  NavigationGuardNext,
  RouteLocationNormalized,
} from "vue-router";

export default function rootGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // e.g. if (!token && to.meta.requiresAuth) return next('/login')
  next();
}
```

A nested folder guard is identical in shape:

```ts
// src/pages/users/_middleware.ts
import type {
  NavigationGuardNext,
  RouteLocationNormalized,
} from "vue-router";

export default function usersGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  next();
}
```

### Directory middleware — default export, **array** of guards

Guards run **left-to-right** within that folder’s layer **before** child-folder `_middleware` or the page `middleware`:

```ts
import type {
  NavigationGuardNext,
  RouteLocationNormalized,
} from "vue-router";

function logVisit(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  console.log(to.fullPath);
  next();
}

function checkSomething(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  next();
}

export default [logVisit, checkSomething];
```

### Per-page `middleware` in a `.vue` SFC

Use this when **one URL** needs logic that doesn’t belong in a whole-folder `_middleware`.

With **`<script setup>`**, keep a **plain `<script lang="ts">` block** (no setup) dedicated to **`middleware`**, plus **`<script setup>`** for the component — this avoids fighting `export default` rules:

```vue
<!-- src/pages/users/add.vue -->
<script lang="ts">
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

/** Runs after all pages/ and pages/users/ _middleware.ts guards. */
export function middleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  next();
}
</script>

<script setup lang="ts">
// page component as usual
</script>

<template>
  <section>…</section>
</template>
```

Equivalent: **`export { myGuard as middleware }`** in the same file.

**Requirement:** the merged glob must **eagerly** load any page module that exports **`middleware`**, e.g. `import.meta.glob('/src/pages/**/*.vue', { eager: true })` for those routes, or list them in a separate eager pattern. Otherwise the export is not available when `createNnnRoutes` runs.

### `.ts`/`.js` route modules

The same **`middleware`** export applies; those entries must still be **eager** in the merged glob map when you rely on composed `middleware`.

### Lazy glob caveat

⚠️ If the page file is only imported through a **lazy** glob (no **`eager: true`**), **`createNnnRoutes`** never sees **`middleware`** exports at generation time — the leaf **`beforeEnter`** contains **only** directory `_middleware.ts` guards that were eager-loaded.

**Reliable split:** eagerly glob **`/_middleware.ts`** only, keep **`*.vue`** lazy. See [Eager vs lazy `import.meta.glob`](#eager-vs-lazy-importmetaglob).

---

## Eager vs lazy `import.meta.glob`

### All eager (simplest — matches quick start)

```ts
const modules = import.meta.glob(["/src/pages/**/*.vue", "/src/pages/**/_middleware.ts"], {
  eager: true,
});

createNnnRoutes(modules as Record<string, unknown>, { routesRoot: "src/pages" });
```

### Lazy pages + eager sidecars (recommended)

Use **`createNnnModules`** — lazy **`.vue`** / layouts, eager **`_middleware.ts`** and **`_redirect.ts`**. Each zone (`users/`, `admin/`, …) loads only when navigated to.

```ts
import { createNnnModules, createNnnRoutes } from "vue-nnn-router";

const lazyViews = import.meta.glob("/src/pages/**/*.{vue,tsx,jsx}");

const eagerSidecars = import.meta.glob(
  ["/src/pages/**/_middleware.ts", "/src/pages/**/_redirect.ts"],
  { eager: true },
);

const modules = createNnnModules({
  views: lazyViews as Record<string, unknown>,
  eager: eagerSidecars as Record<string, unknown>,
});

const routes = createNnnRoutes(modules, { routesRoot: "src/pages" });
```

- **`warnIfEagerPages`** runs automatically (disable with `silent: true`) when all page modules are eager.
- Folders **with or without** `_layout.vue` both work — lazy applies per matched file.
- Per-page **`middleware`** in `.vue` still requires that file to be **eager** (prefer `_middleware.ts`).

### Manual merge (same idea)

```ts
const lazyViews = import.meta.glob("/src/pages/**/*.vue");
const eagerMw = import.meta.glob("/src/pages/**/_middleware.ts", { eager: true });

const modules = {
  ...(lazyViews as Record<string, unknown>),
  ...(eagerMw as Record<string, unknown>),
};

const routes = createNnnRoutes(modules, { routesRoot: "src/pages" });
```

**Note:** Middleware files under **`/src/pages/**`** are usually separate keys from **`.vue`** files — no key collision unless you overlap patterns carelessly.

---

## Route meta & utilities

Each generated leaf sets **`meta.nnnFile`** to the **original** glob key (before strip), which helps editors and debugger linking.

### Route `name` (auto-generated)

Every route gets a **`name`** from its **absolute URL path** (after `prefix`), not from Vue `defineOptions({ name })`.

| URL path | `route.name` | `ROUTER_NAME` key (camelCase) |
|----------|--------------|-------------------------------|
| `/` | `home` | `home` |
| `/users/add` | `users-add` | `usersAdd` |
| `/users/:id` | `users-id` | `usersId` |
| Layout `/users` | `users-layout` | `usersLayout` |
| Redirect `/settings` | `settings-redirect` | `settingsRedirect` |

Custom route names are **not** configurable yet — use **`collectRouteNames`**, **`createNnnRoutesWithNames`**, or the Vite plugin below.

### `ROUTER_NAME` constants (camelCase)

**Runtime:**

```ts
import { createNnnRoutesWithNames } from "vue-nnn-router";

const { routes, routeNames } = createNnnRoutesWithNames(modules, {
  routesRoot: "src/pages",
});

router.push({ name: routeNames.usersAdd });
```

**Generated file** (dev/build) via Vite plugin:

```ts
// vite.config.ts
import { vueNnnRouterNamesPlugin } from "vue-nnn-router/vite";

export default defineConfig({
  plugins: [
    vueNnnRouterNamesPlugin({
      pages: [
        "src/pages/**/*.{vue,tsx,jsx,ts,js}",
        "src/pages/**/_middleware.ts",
        "src/pages/**/_redirect.ts",
      ],
      routesRoot: "src/pages",
      outFile: "src/router/router-name.ts", // optional — default
    }),
  ],
});
```

Output:

```ts
export const ROUTER_NAME = {
  home: "home",
  usersAdd: "users-add",
  usersLayout: "users-layout",
} as const;
```

```ts
import { ROUTER_NAME } from "@/router/router-name";

router.push({ name: ROUTER_NAME.usersAdd });
```

**Exported helpers:** `createNnnModules`, **`warnIfEagerPages`**, `createSpaNnnRoutes`, `createNnnRoutesWithNames`, **`collectRouteNames`**, **`routeNameToCamelKey`**, **`formatRouterNameModule`**, `pathNoExt`, `segmentUrlFromFs`, `mwPrefixesForPathNoExt`, **`warnIfRoutesRootLikelyWrong`**, `simplifyGlobKey`, **`stripRoutesRoot`**, `normalizePath`, `pathFromSegments`, **`isMiddlewareKey`**, **`middlewareDirFromNormKey`**, **`middlewareLogicalKey`**, **`isRedirectKey`**, **`redirectDirFromNormKey`**, **`dynamicScore`**, **`isLazyGlobModule`**, **`isEagerPageModule`**. Vite: **`vueNnnRouterNamesPlugin`** from **`vue-nnn-router/vite`**. Constants: **`NNN_LAZY_VIEW_GLOBS`**, **`NNN_EAGER_SIDECAR_GLOBS`**.

---

## Run the demo (this repo)

The `demo/` app aliases **`vue-nnn-router`** to **`../src`**.

```bash
npm install
npm run demo:install
npm run demo:dev
```

Demo pages live in **`demo/src/pages/`**.

---

## Package

[**vue-nnn-router on npm**](https://www.npmjs.com/package/vue-nnn-router) · [CHANGELOG.md](CHANGELOG.md)

## License

MIT — see [LICENSE](LICENSE).
