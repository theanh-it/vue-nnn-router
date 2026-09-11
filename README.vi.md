# vue-nnn-router

File-based routing cho SPA dùng [Vue Router](https://router.vuejs.org/). Chuyển map từ Vite `import.meta.glob` thành routes có layout, dynamic segment, middleware, redirect, tên route, scroll behavior, progress bar và tùy chọn smooth scrolling bằng Lenis.

[English](README.md) · **Tiếng Việt** · [npm](https://www.npmjs.com/package/vue-nnn-router) · [Changelog](CHANGELOG.md)

## Tính năng

- `index.vue`, page lồng nhau và `_layout.vue`
- `[id].vue` hoặc `[id]/index.vue` → `:id`
- `_middleware.ts` kế thừa theo thư mục
- `_redirect.ts` làm page mặc định cho layout
- Page lazy-load, middleware và redirect eager-load
- Tên route ổn định và có thể sinh file hằng số
- Scroll khi chuyển route và cấu hình scroll theo từng page
- Progress bar và smooth scrolling liên tục bằng Lenis

## Cài đặt

```bash
npm install vue-nnn-router
```

Yêu cầu:

- Vue `^3.3`
- Vue Router `^4.2` hoặc `^5.0`
- Vite, hoặc công cụ khác cung cấp map có cấu trúc như `import.meta.glob`

Chỉ cần cài Lenis khi dùng smooth scrolling liên tục:

```bash
npm install lenis
```

## Bắt đầu nhanh

Tạo các page trong `src/pages`:

```text
src/pages/
├── index.vue                 # /
├── about.vue                 # /about
└── users/
    ├── _layout.vue           # bọc /users/**; cần render <RouterView />
    ├── _middleware.ts        # chạy cho /users/**
    ├── index.vue             # /users
    ├── add.vue               # /users/add
    └── [id].vue              # /users/:id
```

Tạo router. Các page được lazy-load; middleware và redirect được tải eager:

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

Mount router như bình thường:

```ts
// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(router).mount("#app");
```

## Quy ước file

| File | Kết quả |
|---|---|
| `index.vue` | URL của thư mục hiện tại |
| `about.vue` | Thêm `/about` |
| `[id].vue` | Thêm `/:id` |
| `[id]/index.vue` | Cũng thêm `/:id` |
| `_layout.vue` | Bọc các route bên dưới thư mục |
| `_middleware.ts` | Chạy trước mọi route bên dưới thư mục |
| `_redirect.ts` | Redirect một layout không có page `index` |

Page component có thể dùng `.vue`, `.tsx`, `.jsx`, `.ts` hoặc `.js`. Hãy thêm extension bạn sử dụng vào glob `views`.

File `_layout.vue` phải render `<RouterView />`:

```vue
<template>
  <main class="users-layout">
    <RouterView />
  </main>
</template>
```

### `routesRoot`

`routesRoot` loại bỏ phần không thuộc URL khỏi mỗi glob key:

| Glob | `routesRoot` |
|---|---|
| `/src/pages/**` | `src/pages` |
| `../pages/**` | `../pages` |
| Key đã có dạng `users/index.vue` | bỏ qua tùy chọn này |

Với glob `/src/pages/**` được khuyến nghị, hãy dùng `routesRoot: "src/pages"`.

### Tùy chọn route

```ts
createNnnRoutes(modules, {
  routesRoot: "src/pages",
  prefix: "app",
  onDuplicate: "first-wins",
  verbose: false,
  silent: false,
});
```

| Tùy chọn | Mặc định | Công dụng |
|---|---:|---|
| `routesRoot` | — | Loại prefix filesystem khỏi glob key |
| `prefix` | — | Thêm một URL prefix cho mọi route |
| `onDuplicate` | `"first-wins"` | Xử lý hai file sinh cùng URL; cũng nhận `"last-wins"` hoặc callback |
| `verbose` | `false` | In bảng path và file đã sinh |
| `logger` | `console.log` | Thay logger dùng cho `verbose` |
| `silent` | `false` | Ẩn warning và output của `verbose` |

## Middleware và redirect

Middleware thư mục chạy từ cha xuống con, sau đó mới tới middleware của page:

```text
pages/_middleware.ts
→ pages/users/_middleware.ts
→ middleware export từ pages/users/add.vue
```

Export một guard hoặc một mảng guard:

```ts
// src/pages/users/_middleware.ts
import type { NavigationGuard } from "vue-router";

const requireUser: NavigationGuard = (to) => {
  if (!hasSession() && to.path !== "/login") return "/login";
};

export default requireUser;
// export default [logVisit, requireUser];
```

Luôn tải `_middleware.ts` ở chế độ eager. Export `middleware` nằm trong page chỉ khả dụng khi chính page đó được eager-load, vì vậy middleware thư mục là lựa chọn phù hợp với page lazy-load.

Dùng `_redirect.ts` cạnh `_layout.vue` nếu thư mục không có page `index`:

```ts
// src/pages/users/_redirect.ts
export default "add"; // /users → /users/add
```

Khi bật `prefix`, nên dùng target tương đối. Target tuyệt đối như `"/users/add"` được giữ nguyên.

## Tên route

Tên được sinh từ URL:

| URL | `route.name` | Key hằng số |
|---|---|---|
| `/` | `home` | `home` |
| `/users/add` | `users-add` | `usersAdd` |
| `/users/:id` | `users-id` | `usersId` |

Để lấy map tại runtime:

```ts
import { createNnnRoutesWithNames } from "vue-nnn-router";

const { routes, routeNames } = createNnnRoutesWithNames(modules, {
  routesRoot: "src/pages",
});

router.push({ name: routeNames.usersAdd });
```

Để tự động sinh file `ROUTER_NAME`, thêm names plugin:

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

File mặc định được tạo tại `src/router/router-name.ts`.

## Cuộn trang

Thư viện có hai chức năng riêng biệt:

| Chức năng | Dùng khi |
|---|---|
| `createNnnScrollBehavior` | Chọn vị trí page sau khi chuyển route: đầu trang, vị trí cũ hoặc hash |
| `createNnnSmoothScroll` | Làm mượt liên tục theo kiểu Lenis khi người dùng cuộn |

### Cuộn sau khi chuyển route

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

Các tùy chọn:

| Tùy chọn | Mặc định | Công dụng |
|---|---:|---|
| `smooth` | `false` | Animate khi cuộn sau chuyển route |
| `restorePosition` | `true` | Khôi phục vị trí khi Back/Forward |
| `scrollToHash` | `true` | Cuộn tới phần tử từ URL hash |
| `top` / `left` | `0` | Offset theo pixel |
| `skipMetaKey` | `"noScroll"` | Bỏ qua nếu route meta tương ứng là truthy; dùng `false` để tắt cơ chế này |
| `scrollMap` | — | Áp dụng cấu hình riêng đã sinh cho từng page |

### Cấu hình scroll theo từng page

Thêm scroll plugin một lần:

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

Plugin sinh file `src/router/router-scroll.ts`. Truyền navigation map vào router:

```ts
import { createNnnScrollBehavior } from "vue-nnn-router";
import { NNN_SCROLL } from "./router-scroll";

scrollBehavior: createNnnScrollBehavior({ scrollMap: NNN_SCROLL });
```

Sau đó cấu hình một page bằng giá trị literal:

```vue
<script setup lang="ts">
import { defineNnnScroll } from "vue-nnn-router";

defineNnnScroll({ top: 80, smooth: true });
// defineNnnScroll(false); // giữ nguyên vị trí hiện tại trên page này
</script>
```

### Smooth scrolling liên tục với Lenis

Cài Lenis và import CSS:

```bash
npm install lenis
```

```ts
// src/main.ts
import "lenis/dist/lenis.css";
```

Khởi tạo controller một lần sau khi tạo router. Scroll plugin phía trên đồng thời sinh `NNN_SMOOTH_SCROLL`:

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

Bật hoặc tắt theo từng page:

```vue
<script setup lang="ts">
import { defineNnnSmoothScroll } from "vue-nnn-router";

defineNnnSmoothScroll(false); // page này dùng native scrolling

// Hoặc override cấu hình mobile toàn cục:
// defineNnnSmoothScroll({ enabled: true, disableOnMobile: false });
</script>
```

| Tùy chọn | Mặc định | Công dụng |
|---|---:|---|
| `enabled` | `true` | Trạng thái mặc định cho page không có override |
| `disableOnMobile` | `false` | Hủy Lenis và dùng native scrolling trên mobile |
| `mobileBreakpoint` | `767` | Chiều rộng mobile tối đa theo pixel |
| `scrollMap` | — | Áp dụng cấu hình riêng đã sinh cho từng page |
| `lenisOptions` | `{ autoRaf: true }` | Chuyển các tùy chọn sang Lenis |

Controller tự tạo hoặc hủy Lenis khi route và viewport thay đổi. Gọi `smoothScroll.destroy()` khi dispose router trong HMR, test hoặc micro-frontend.

Cả `defineNnnScroll(...)` và `defineNnnSmoothScroll(...)` phải nhận object hoặc boolean literal để Vite plugin có thể đọc được.

## Progress bar khi chuyển trang

Progress bar không cần CSS hay dependency bên thứ ba:

```ts
import { createNnnProgress } from "vue-nnn-router/progress";

const progress = createNnnProgress(router, {
  color: "#ff4d00",
  height: 3,
  position: "top",
  delay: 120,
});
```

| Tùy chọn | Mặc định | Công dụng |
|---|---:|---|
| `enabled` | `true` | Bật progress bar |
| `color` | `"#ff4d00"` | Màu thanh và glow |
| `height` | `3` | Độ dày CSS; số được hiểu là pixel |
| `position` | `"top"` | `"top"` hoặc `"bottom"` |
| `delay` | `120` | Chờ trước khi hiện để tránh nhấp nháy |
| `minimumVisible` | `0` | Thời gian hiển thị tối thiểu theo mili giây |
| `zIndex` | `2147483647` | Thứ tự xếp lớp |

Gọi `progress.destroy()` khi cần cleanup. Import `createNnnProgress` từ `vue-nnn-router` vẫn hoạt động để tương thích ngược.

## Các đường dẫn import

| Import | Export chính |
|---|---|
| `vue-nnn-router` | Sinh route, helper cho module, tên route, navigation scroll và khai báo theo page |
| `vue-nnn-router/progress` | `createNnnProgress` |
| `vue-nnn-router/smooth-scroll` | `createNnnSmoothScroll` và các type liên quan |
| `vue-nnn-router/vite` | Plugin sinh file tên route và cấu hình scroll |

Mỗi leaf route được sinh có `meta.nnnFile`, chứa glob key gốc để debug. Package đã bao gồm TypeScript declarations.

## Lỗi thường gặp

- **URL chứa `/src/pages`:** đặt `routesRoot: "src/pages"` cho glob `/src/pages/**`.
- **Page lồng nhau bị trống:** kiểm tra `_layout.vue` có render `<RouterView />`.
- **Middleware không chạy:** tải `_middleware.ts` với `{ eager: true }`.
- **Cấu hình scroll theo page không hoạt động:** thêm `vueNnnRouterScrollPlugin` và dùng argument literal.
- **Không resolve được Lenis:** cài `lenis` và import `lenis/dist/lenis.css`.

## Demo

```bash
npm install
npm run demo:install
npm run demo:dev
```

Mở `/smooth-scroll` để test Lenis và `/about` để so sánh với native scrolling.

## Giấy phép

MIT — xem [LICENSE](LICENSE).
