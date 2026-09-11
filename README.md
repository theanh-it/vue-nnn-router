# vue-nnn-router

File-based SPA routing for [Vue Router](https://router.vuejs.org/). Turn a Vite `import.meta.glob` map into routes with layouts, dynamic segments, middleware, redirects, route names, scroll behavior, a progress bar, and optional Lenis smooth scrolling.

**English** · [Tiếng Việt](README.vi.md) · [npm](https://www.npmjs.com/package/vue-nnn-router) · [Changelog](CHANGELOG.md)

## Features

- `index.vue`, nested pages, and `_layout.vue`
- `[id].vue` or `[id]/index.vue` → `:id`
- Cascading `_middleware.ts`
- `_redirect.ts` for a layout's default child
- Lazy-loaded pages with eager middleware and redirects
- Stable route names and optional generated constants
- Route-change scrolling and per-page scroll settings
- Optional progress bar and Lenis continuous smooth scrolling

## Install

```bash
npm install vue-nnn-router
```

Requirements:

- Vue `^3.3`
- Vue Router `^4.2` or `^5.0`
- Vite, or another tool that provides an `import.meta.glob`-shaped map

Lenis is only required for continuous smooth scrolling:

```bash
npm install lenis
```

## Quick start

Create pages under `src/pages`:

```text
src/pages/
├── index.vue                 # /
├── about.vue                 # /about
└── users/
    ├── _layout.vue           # wraps /users/**; render <RouterView />
    ├── _middleware.ts        # runs for /users/**
    ├── index.vue             # /users
    ├── add.vue               # /users/add
    └── [id].vue              # /users/:id
```

Create the router. Pages stay lazy; middleware and redirects load eagerly:

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import {
  createNnnModules,
  createNnnRoutes,
} from "vue-nnn-router";

const views = import.meta.glob("/src/pages/**/*.{vue,tsx,jsx}");

const sidecars = import.meta.glob(
  ["/src/pages/**/_middleware.{ts,js}", "/src/pages/**/_redirect.{ts,js}"],
  { eager: true },
);

const modules = createNnnModules({
  views: views as Record<string, unknown>,
  eager: sidecars as Record<string, unknown>,
});

const routes = createNnnRoutes(modules, {
  routesRoot: "src/pages",
});

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

Mount it normally:

```ts
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(router).mount("#app");
```

## File conventions

| File | Result |
|---|---|
| `index.vue` | The current folder's URL |
| `about.vue` | Adds `/about` |
| `[id].vue` | Adds `/:id` |
| `[id]/index.vue` | Also adds `/:id` |
| `_layout.vue` | Wraps routes below that folder |
| `_middleware.ts` | Runs before every route below that folder |
| `_redirect.ts` | Redirects a layout that has no `index` page |

Page components may use `.vue`, `.tsx`, `.jsx`, `.ts`, or `.js`. Add any extensions you use to the `views` glob.

An `_layout.vue` must render `<RouterView />`:

```vue
<template>
  <main class="users-layout">
    <RouterView />
  </main>
</template>
```

### `routesRoot`

`routesRoot` removes the non-URL part of each glob key:

| Glob | `routesRoot` |
|---|---|
| `/src/pages/**` | `src/pages` |
| `../pages/**` | `../pages` |
| Keys already look like `users/index.vue` | omit it |

For the recommended `/src/pages/**` glob, use `routesRoot: "src/pages"`.

### Route options

```ts
createNnnRoutes(modules, {
  routesRoot: "src/pages",
  prefix: "app",
  onDuplicate: "first-wins",
  verbose: false,
  silent: false,
});
```

| Option | Default | Purpose |
|---|---:|---|
| `routesRoot` | — | Remove the filesystem prefix from glob keys |
| `prefix` | — | Add one URL prefix to every route |
| `onDuplicate` | `"first-wins"` | Resolve two files that produce the same URL; also accepts `"last-wins"` or a callback |
| `verbose` | `false` | Print the generated path-to-file table |
| `logger` | `console.log` | Replace the verbose logger |
| `silent` | `false` | Hide warnings and verbose output |

## Middleware and redirects

Directory middleware cascades from parent to child, then page middleware runs last:

```text
pages/_middleware.ts
→ pages/users/_middleware.ts
→ middleware exported by pages/users/add.vue
```

Export one guard or an array of guards:

```ts
// src/pages/users/_middleware.ts
import type { NavigationGuard } from "vue-router";

const requireUser: NavigationGuard = (to) => {
  if (!hasSession() && to.path !== "/login") return "/login";
};

export default requireUser;
// export default [logVisit, requireUser];
```

Keep `_middleware.ts` eager. A `middleware` export inside a page is only available when that page itself is eager, so directory middleware is the recommended choice with lazy pages.

Use `_redirect.ts` beside `_layout.vue` when the folder has no `index` page:

```ts
// src/pages/users/_redirect.ts
export default "add"; // /users → /users/add
```

Use a relative target when `prefix` is enabled. An absolute target such as `"/users/add"` is used unchanged.

## Route names

Names are generated from URLs:

| URL | `route.name` | Constant key |
|---|---|---|
| `/` | `home` | `home` |
| `/users/add` | `users-add` | `usersAdd` |
| `/users/:id` | `users-id` | `usersId` |

For a runtime map:

```ts
import { createNnnRoutesWithNames } from "vue-nnn-router";

const { routes, routeNames } = createNnnRoutesWithNames(modules, {
  routesRoot: "src/pages",
});

router.push({ name: routeNames.usersAdd });
```

For an auto-generated `ROUTER_NAME` file, add the names plugin:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vueNnnRouterNamesPlugin } from "vue-nnn-router/vite";

export default defineConfig({
  plugins: [
    vueNnnRouterNamesPlugin({
      pages: [
        "src/pages/**/*.{vue,tsx,jsx}",
        "src/pages/**/_redirect.{ts,js}",
      ],
      routesRoot: "src/pages",
    }),
  ],
});
```

```ts
import { ROUTER_NAME } from "./router-name";

router.push({ name: ROUTER_NAME.usersAdd });
```

The default output is `src/router/router-name.ts`.

## Scrolling

There are two separate features:

| Feature | Use it for |
|---|---|
| `createNnnScrollBehavior` | Where the page moves after navigation: top, saved position, or hash |
| `createNnnSmoothScroll` | Lenis-style continuous smoothing while the user scrolls |

### Scroll after navigation

```ts
import { createNnnScrollBehavior } from "vue-nnn-router";

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: createNnnScrollBehavior({
    restorePosition: true,
    scrollToHash: true,
    top: 0,
  }),
});
```

Options:

| Option | Default | Purpose |
|---|---:|---|
| `smooth` | `false` | Animate the route-change scroll |
| `restorePosition` | `true` | Restore position on Back/Forward |
| `scrollToHash` | `true` | Scroll to the URL hash target |
| `top` / `left` | `0` | Scroll offsets in pixels |
| `skipMetaKey` | `"noScroll"` | Skip when that route meta value is truthy; use `false` to disable |
| `scrollMap` | — | Apply generated per-page settings |

### Per-page scroll settings

Add the scroll plugin once:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vueNnnRouterScrollPlugin } from "vue-nnn-router/vite";

export default defineConfig({
  plugins: [
    vueNnnRouterScrollPlugin({
      pages: "src/pages/**/*.{vue,tsx,jsx}",
    }),
  ],
});
```

It generates `src/router/router-scroll.ts`. Pass its navigation map to the router:

```ts
import { createNnnScrollBehavior } from "vue-nnn-router";
import { NNN_SCROLL } from "./router-scroll";

scrollBehavior: createNnnScrollBehavior({ scrollMap: NNN_SCROLL });
```

Then configure a page with a literal value:

```vue
<script setup lang="ts">
import { defineNnnScroll } from "vue-nnn-router";

defineNnnScroll({ top: 80, smooth: true });
// defineNnnScroll(false); // keep the current position on this page
</script>
```

### Continuous smooth scrolling with Lenis

Install Lenis and import its CSS:

```bash
npm install lenis
```

```ts
// src/main.ts
import "lenis/dist/lenis.css";
```

Attach the controller once after creating the router. The same scroll plugin generates `NNN_SMOOTH_SCROLL`:

```ts
import { createNnnSmoothScroll } from "vue-nnn-router/smooth-scroll";
import { NNN_SMOOTH_SCROLL } from "./router-scroll";

const smoothScroll = createNnnSmoothScroll(router, {
  disableOnMobile: true,
  mobileBreakpoint: 767,
  scrollMap: NNN_SMOOTH_SCROLL,
  lenisOptions: {
    lerp: 0.1,
    smoothWheel: true,
  },
});
```

Control it per page:

```vue
<script setup lang="ts">
import { defineNnnSmoothScroll } from "vue-nnn-router";

defineNnnSmoothScroll(false); // use native scrolling on this page

// Or override the global mobile setting:
// defineNnnSmoothScroll({ enabled: true, disableOnMobile: false });
</script>
```

| Option | Default | Purpose |
|---|---:|---|
| `enabled` | `true` | Default state for pages without an override |
| `disableOnMobile` | `false` | Destroy Lenis and use native scrolling on mobile |
| `mobileBreakpoint` | `767` | Maximum mobile viewport width in pixels |
| `scrollMap` | — | Apply generated per-page settings |
| `lenisOptions` | `{ autoRaf: true }` | Forward options to Lenis |

The controller creates or destroys Lenis as the route and viewport change. Call `smoothScroll.destroy()` when disposing the router in HMR, tests, or a micro-frontend.

Both `defineNnnScroll(...)` and `defineNnnSmoothScroll(...)` must receive an object or boolean literal so the Vite plugin can extract them.

## Navigation progress bar

The progress bar has no CSS or third-party dependency:

```ts
import { createNnnProgress } from "vue-nnn-router/progress";

const progress = createNnnProgress(router, {
  color: "#ff4d00",
  height: 3,
  position: "top",
  delay: 120,
});
```

| Option | Default | Purpose |
|---|---:|---|
| `enabled` | `true` | Enable the progress bar |
| `color` | `"#ff4d00"` | Bar and glow color |
| `height` | `3` | CSS thickness; numbers mean pixels |
| `position` | `"top"` | `"top"` or `"bottom"` |
| `delay` | `120` | Wait before showing to avoid flashes |
| `minimumVisible` | `0` | Minimum visible time in milliseconds |
| `zIndex` | `2147483647` | Stacking level |

Call `progress.destroy()` when cleanup is required. Importing `createNnnProgress` from `vue-nnn-router` still works for backward compatibility.

## Import paths

| Import | Main exports |
|---|---|
| `vue-nnn-router` | Route generation, module helpers, names, navigation scroll, and per-page declarations |
| `vue-nnn-router/progress` | `createNnnProgress` |
| `vue-nnn-router/smooth-scroll` | `createNnnSmoothScroll` and its types |
| `vue-nnn-router/vite` | Route-name and scroll code-generation plugins |

Generated leaf routes include `meta.nnnFile`, containing the original glob key for debugging. TypeScript declarations are included.

## Common issues

- **URLs contain `/src/pages`:** set `routesRoot: "src/pages"` for a `/src/pages/**` glob.
- **A nested page is blank:** make sure its `_layout.vue` renders `<RouterView />`.
- **Middleware does not run:** load `_middleware.ts` with `{ eager: true }`.
- **Per-page scroll settings are ignored:** add `vueNnnRouterScrollPlugin` and use a literal argument.
- **Lenis cannot be resolved:** install `lenis` and import `lenis/dist/lenis.css`.

## Demo

```bash
npm install
npm run demo:install
npm run demo:dev
```

Open `/smooth-scroll` to test Lenis and `/about` to compare native scrolling.

## License

MIT — see [LICENSE](LICENSE).
