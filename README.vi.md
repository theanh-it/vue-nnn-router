# vue-nnn-router

**Định tuyến theo thư mục** cho **[Vue Router](https://router.vuejs.org/)** (**4.x** hoặc **5.x**): SPA với **`index.vue`**, **`_layout.vue`** và **`_redirect.ts`** (tùy chọn), **`[param]` → `:param`**, middleware xếp chồng **`_middleware.ts`**, dựa trên map **`import.meta.glob`** của Vite (hoặc `Record<string, unknown>` tương đương).

[Tiếng Anh](README.md) | **Tiếng Việt**

## Mục lục

1. Vì sao dùng glob, không đọc filesystem?
2. Cài đặt & yêu cầu
3. Bắt đầu nhanh
4. Cấu trúc thư mục & URL
5. Pattern glob và `routesRoot` (ba trường hợp)
6. Tùy chọn `createNnnRoutes` (có ví dụ từng mục)
7. Middleware (theo thư mục và theo trang)
8. Glob eager vs lazy
9. Meta route & tiện ích
10. Chạy demo trong repo này
11. Gói npm & giấy phép

## Vì sao dùng glob, không đọc filesystem?

Trên trình duyệt không có API filesystem để có “cây route thật” lúc chạy, nên thư viện biến **map từ glob** (Vite ghép lúc build) thành **`RouteRecordRaw[]`**.

## Cài đặt & yêu cầu

```bash
npm install vue-nnn-router
```

- **Vue** `^3.3` (nếu dùng **Vue Router 5**, làm theo peer của họ — thường **Vue `^3.5`**).
- **Vue Router** `^4.2` **hoặc** `^5.0`: thư viện chỉ sinh **`RouteRecordRaw[]`** và chuỗi **`beforeEnter`**, API tương thích hai dòng phiên bản.
- **Vite** và **`import.meta.glob`** (hoặc object có hình dạng tương tự)

Guard trong **`_middleware.ts`** và export **`middleware`** theo kiểu gọi **`next()`** mà hai major đều hỗ trợ; bản **5** có thể **deprecated** và gợi ý chuyển sang guard `return`/redirect mới trong tài liệu Vue Router — không bắt buộc đổi ngay trong mã của bạn.

## Bắt đầu nhanh

**1.** Đặt trang trong **`src/pages/`** (đặt tên **`pages`** là quy ước hay dùng).

**2.** Thu map module và gọi **`createNnnRoutes`**:

```ts
// vd. src/router/index.ts
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

**3.** Gắn router vào **`main.ts`** như app Vue Router thông thường.

## Cấu trúc thư mục & URL

```
pages/
  _middleware.ts           # middleware gốc: mọi trang dưới pages/
  index.vue                # URL /
  about/
    index.vue              # /about
  users/
    _layout.vue            # bọc /users/** — bắt buộc có <RouterView />
    _middleware.ts
    _redirect.ts           # (tùy chọn) redirect /users khi không có index.vue
    index.vue              # /users
    add.vue                # /users/add
    [id].vue               # /users/:id (rút gọn; tương đương users/[id]/index.vue)
```

- **Phần mở rộng được hỗ trợ:** `.vue`, `.tsx`, `.jsx`, `.ts`, `.js`.
- **`index.*`:** URL “mục lục” của thư mục đó.
- **Basename khác (`add.vue`, …):** thêm một segment URL.
- **`[param]`** trong tên file hoặc thư mục → **`[id]` becomes `:id`** trong path.
- **`_layout.vue`:** layout cho route con (cùng quy ước **`_`** với **`_middleware.ts`**); route con render trong **`<RouterView />`**.
- **`_redirect.ts`:** khi thư mục có **`_layout`** nhưng **không** có **`index.*`**, lib sinh route con `{ path: "", redirect: "..." }`. `export default` là URL tuyệt đối (`"/users/add"`) hoặc tương đối (`"add"`). Nếu đã có **`index.*`** thì **`_redirect` bị bỏ qua**.

## Pattern glob và `routesRoot`

Mỗi key trong map glob được chuẩn hoá bằng **`simplifyGlobKey`** (bỏ `./` đầu, bỏ một **`/`** đầu) rồi **`stripRoutesRoot`** khi có **`routesRoot`**.

**`routesRoot`** phải **trùng chính xác tiền tố** của key đã chuẩn hoá — phần nằm **trước** đường dẫn qui ước route (`about/index.vue`, …).

### Trường hợp A — Glob neo root dự án (nên dùng)

Pattern bắt đầu bằng **`/`** → tính từ **root Vite** (thư mục chứa **`vite.config`**).

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

Key dạng **`src/pages/about/index.vue`** → bỏ **`src/pages`** → **`about/index.vue`**.

### Trường hợp B — Glob tương đối file gọi `import.meta.glob`

Thích hợp khi **`src/router/index.ts`** nằm cạnh **`src/pages/`**:

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

Key dạng **`../pages/about/index.vue`**.

### Trường hợp C — Map tay, không strip

Nếu **không truyền `routesRoot`**, key sau chuẩn hoá phải **đúng là cây route** (không còn tiền tố kiểu **`src/pages`**). Hữu ích cho test hoặc codegen.

```ts
createNnnRoutes(
  {
    "about/index.vue": { default: AboutPage },
    "index.vue": { default: HomePage },
  } as Record<string, unknown>,
  {
    // không routesRoot — key CHÍNH LÀ path cây sau normalize
  },
);
```

❌ Lỗi thường gặp: dùng **trường hợp A** nhưng đặt **`routesRoot: "pages"`** — key thực tế là **`src/pages/...`**, tiền tố **`pages`** **không** khớp. Hãy dùng **`routesRoot: "src/pages"`** hoặc chuyển sang **trường hợp B**.

---

## Tùy chọn `createNnnRoutes` (có ví dụ)

| Tùy chọn      | Việc làm |
|---------------|-----------|
| `routesRoot`  | Bớt tiền tố filesystem khỏi mỗi key glob (sau `simplifyGlobKey`). |
| `prefix`      | Segment URL đứng trước **mọi** route được sinh. |
| `onDuplicate` | Hai file cùng cho một URL. |
| `verbose`     | In bảng path ↔ file sau khi build xong cây route. |
| `logger`      | Hàm in thay cho **`console.log`** khi bật **`verbose`**. |
| `silent`      | Tắt cảnh báo và tắt kênh in của **`verbose`**. |

**Mặc định khi trùng URL:** giữ **file “first-wins”** (theo thứ tự nội bộ ổn định). Đặt **`onDuplicate: "last-wins"`** để giữ bản ngược lại. Thư viện vẫn **`console.warn`** khi trùng, trừ khi **`silent: true`** hoặc bạn truyền **callback** (callback thay cho cảnh báo mặc định cho các cặp trùng đó).

### `routesRoot`

Đã minh họa ở trên. Có thể dùng **`warnIfRoutesRootLikelyWrong`** khi kiểm tra cấu hình (đã export trong gói — mục **Meta route & tiện ích** bên dưới).

### `prefix`

Thêm một segment cố định phía trước mọi path (**slashes đầu/cuối được chuẩn hoá**):

```ts
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  prefix: "/app", // hoặc "app"
});
```

- Trang từng là **`/`** → **`/app`** (sau **`normalizePath`**).
- **`/users`** → **`/app/users`**.

### `onDuplicate`: `"first-wins"` \| `"last-wins"` \| callback

Hai file khác nhau nhưng cùng một URL đích:

```ts
// Giữ bản được xếp “sau” theo logic nội bộ sau khi đọc glob:
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  onDuplicate: "last-wins",
  silent: true, // nếu trùng URL là chủ đích và không muốn cảnh báo
});

// Hoặc tự xử lý — không có console.warn trùng mặc định của thư viện:
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  onDuplicate: (path, files) => {
    console.error(`Trùng URL ${path}`, files);
  },
});
```

### `verbose` và `logger`

```ts
createNnnRoutes(modules as Record<string, unknown>, {
  routesRoot: "src/pages",
  verbose: true,
  logger: (...args) => {
    args.forEach((a) => myTooling.log(String(a)));
  },
});
```

Khi **`silent: true`** thì **`verbose`** không còn gì để gửi (**`logger`** bị tắt cùng kênh log).

### `silent`

Ẩn **toàn bộ** (trong giới hạn thư viện):

- Cảnh báo trùng URL
- Cảnh báo **`routesRoot`** / middleware trùng, v.v.
- In bảng khi **`verbose`**

---

## Middleware (theo thư mục và theo trang)

### Tóm tắt nhanh

| Mục đích | Dùng gì |
|---------|---------|
| Chạy **trước mọi trang** trong một thư mục và các thư mục con | **`_middleware.ts`** — `export default` một guard hoặc `export default [a, b]` |
| Chỉ áp cho **một URL** | Trong đúng module trang: **`export function middleware`** (hoặc `export { … as middleware }`) — glob file đó phải **`eager`** |
| Muốn code-split trang lazy mà vẫn có guard | Tách **`_middleware.ts`** trong glob riêng **`{ eager: true }`** |

### File layout

Đặt **`_middleware.ts`** (hoặc **`_middleware.js`**) trong thư mục trang — nó áp cho **toàn bộ subtree** URL bên dưới thư mục đó (kể các trang không có `_middleware` riêng ở tầng sâu hơn).

```text
src/pages/
  _middleware.ts          ← guard gốc: mọi URL dưới pages/
  index.vue               ← /
  users/
    _middleware.ts        ← thêm guard cho mọi URL dưới /users/...
    index.vue             ← /users
    add.vue               ← /users/add
```

### Thứ tự khi vào một URL

Vue Router chỉ có một chuỗi **`beforeEnter`** trên từng **record lá**. Thư viện **ghép** guards từ:

1. **`_middleware.ts`** từ thư mục gốc `pages/` (tiền tố rỗng),
2. rồi từng **`_middleware.ts`** sâu dần theo path (`users/`, …),
3. cuối cùng là **`middleware`** export trên **chính file trang** (nếu có và module đã nạp **eager**).

**Ví dụ** điều hướng tới **`/users/add`** (đủ file như cây trên):

1. Hàm trong **`pages/_middleware.ts`**
2. Hàm trong **`pages/users/_middleware.ts`**
3. (Nếu có) **`middleware`** trong **`pages/users/add.vue`**

Nếu bất kỳ guard gọi `next(false)`, ném lỗi, hoặc `next('/elsewhere')` thì các bước sau có thể **không** chạy (theo luật của Vue Router).

### `_redirect.ts` — trang mặc định khi layout không có `index`

Khi thư mục có **`_layout.vue`** nhưng **không** có **`index.vue`**, vào URL cha (vd. `/users`) sẽ chỉ render layout với `<RouterView />` trống. Đặt **`_redirect.ts`** cạnh **`_layout`** để lib tự sinh `{ path: "", redirect: "..." }`:

```ts
// src/pages/users/_redirect.ts
export default "add"; // → redirect /users → /users/add

// hoặc URL tuyệt đối:
// export default "/users/add";
```

Glob cần nạp file này (pattern `**/*.{ts,js}` hoặc `**/_redirect.ts`, **eager**).

Nếu đã có **`index.*`**, **`_redirect` bị bỏ qua** — `index` luôn là trang mặc định.

**Khi có `prefix`:** nên dùng đích **tương đối** (`"add"` → `/app/users/add` với `prefix: "app"`). Đường dẫn **tuyệt đối** (`"/users/add"`) giữ nguyên, **không** tự thêm `prefix`.

### Middleware thư mục — `export default` một guard

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
  // vd. kiểm tra token trước mọi trang:
  // if (!token && to.meta.requiresAuth) return next('/login')
  next();
}
```

Guard lồng sâu hơn chỉ là file khác, cùng kiểu chữ ký:

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

### Middleware thư mục — `export default` mảng guards

Giữ **đúng thứ tự** trong mảng — từng hàm chạy nối tiếp trong cùng “lớp” thư mục đó (trước khi tới `_middleware` của con hoặc `middleware` của trang):

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

### Middleware **theo trang** — export `middleware` trong file `.vue`

Dùng khi chỉ một URL cần logic (không đặt được gọn trong `_middleware` của cả folder).

Khối **`script setup`** thường chỉ **`export default` ẩn** cho component, nên cách rõ ràng là **một khối `<script>` (không setup)** chỉ để export guard, và một khối **`<script setup>`** cho component:

```vue
<!-- src/pages/users/add.vue -->
<script lang="ts">
import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

/** Chạy sau mọi _middleware.ts của pages/ và users/. */
export function middleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  next();
}
</script>

<script setup lang="ts">
// component trang như bình thường
</script>

<template>
  <section>…</section>
</template>
```

Tương đương: **`export { myGuard as middleware }`** từ cùng file nếu bạn không dùng `export function middleware`.

**Điều kiện:** map glob phải **eager** nạp những file trang có export **`middleware`** (ví dụ `import.meta.glob('/src/pages/**/*.vue', { eager: true })` cho các route đó, hoặc tách một pattern eager riêng). Nếu không, lúc gọi `createNnnRoutes` thư viện không đọc được export đó.

### Trang viết bằng `.ts`/`.js` + component

Guard vẫn đọc từ export có tên **`middleware`** trên module (một guard hoặc mảng). Vẫn cần **eager** trong glob nếu bạn muốn guard đó được ghép vào `beforeEnter` lúc build route.

### Lưu ý với lazy glob

⚠️ Nếu trang chỉ xuất hiện trong glob **lazy** (không **`eager: true`**), **`createNnnRoutes`** **không** đọc được export **`middleware`** của file đó lúc build — **`beforeEnter`** của lá route đó chỉ có chuỗi từ **`_middleware.ts`** đã nạp sẵn.

Cách an toàn: glob riêng **`/src/pages/**/_middleware.ts`** với **`{ eager: true }`**; các file **`.vue`** có thể lazy. Chi tiết thêm ở mục **Glob eager vs lazy** ngay bên dưới.

---

## Glob eager vs lazy

### Toàn bộ eager (đơn giản — như ví dụ **Bắt đầu nhanh** trên đây)

```ts
const modules = import.meta.glob(["/src/pages/**/*.vue", "/src/pages/**/_middleware.ts"], {
  eager: true,
});

createNnnRoutes(modules as Record<string, unknown>, { routesRoot: "src/pages" });
```

### Trang lazy + middleware eager (chia tách nên dùng)

Giữ **`_middleware.ts`** nạp sẵn để cascade guard vẫn gắn đồng bộ:

```ts
const lazyViews = import.meta.glob("/src/pages/**/*.vue"); // mặc định lazy
const eagerMw = import.meta.glob("/src/pages/**/_middleware.ts", { eager: true });

const modules = {
  ...(lazyViews as Record<string, unknown>),
  ...(eagerMw as Record<string, unknown>),
};

const routes = createNnnRoutes(modules, {
  routesRoot: "src/pages",
});
```

Key **`.vue`** và **`_middleware.ts`** thường **không** trùng tên trong map — chỉ va chạm nếu khai báo pattern chồng lấn vô ích.

---

## Meta route & tiện ích

Mỗi lá route có **`meta.nnnFile`** = **key glob gốc** (trước `stripRoutesRoot`), tiện nhảy vào file trong IDE/debug.

**Export tiện ích:** `createSpaNnnRoutes`, `pathNoExt`, `segmentUrlFromFs`, `mwPrefixesForPathNoExt`, **`warnIfRoutesRootLikelyWrong`**, `simplifyGlobKey`, **`stripRoutesRoot`**, `normalizePath`, `pathFromSegments`, **`isMiddlewareKey`**, **`middlewareDirFromNormKey`**, **`middlewareLogicalKey`**, **`isRedirectKey`**, **`redirectDirFromNormKey`**, **`dynamicScore`**.

---

## Chạy demo (repo này)

`demo/` alias gói tới **`../src`**.

```bash
npm install
npm run demo:install
npm run demo:dev
```

Trang mẫu: **`demo/src/pages/`**.

---

## Gói & giấy phép

[**vue-nnn-router trên npm**](https://www.npmjs.com/package/vue-nnn-router) · [**CHANGELOG**](CHANGELOG.md)

## Giấy phép

MIT — xem [LICENSE](LICENSE).
