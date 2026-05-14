import { describe, expect, it, vi } from "vitest";
import type { NavigationGuardNext } from "vue-router";
import { createNnnRoutes } from "../src/createNnnRoutes";

const Stub = { template: "<div/>" };

describe("createNnnRoutes (SPA)", () => {
  it("middleware thư mục + middleware theo route (beforeEnter)", async () => {
    const mwRoot = vi.fn((_to: unknown, _from: unknown, next: NavigationGuardNext) =>
      next()
    );
    const mwUsers = vi.fn((_to: unknown, _from: unknown, next: NavigationGuardNext) =>
      next()
    );
    const mwRouteOnly = vi.fn(
      (_to: unknown, _from: unknown, next: NavigationGuardNext) => next()
    );

    const glob = {
      "src/pages/_middleware.ts": { default: mwRoot },
      "src/pages/users/_middleware.ts": { default: mwUsers },
      "src/pages/users/index.vue": {
        default: Stub,
        middleware: mwRouteOnly,
      },
    };

    const routes = createNnnRoutes(glob, {
      silent: true,
      routesRoot: "src/pages",
      onDuplicate: "first-wins",
    });

    expect(routes).toHaveLength(1);
    const r = routes[0]!;
    const chain = Array.isArray(r.beforeEnter)
      ? r.beforeEnter
      : r.beforeEnter
        ? [r.beforeEnter]
        : [];

    expect(chain.map((fn) => String(fn))).toEqual([
      String(mwRoot),
      String(mwUsers),
      String(mwRouteOnly),
    ]);
  });

  it("prefix và mapping path sau routesRoot", () => {
    const glob = {
      "pages/index.vue": { default: Stub },
      "pages/products/[slug]/index.vue": { default: Stub },
    };

    const routes = createNnnRoutes(glob, {
      silent: true,
      prefix: "/app",
      routesRoot: "pages",
    });

    expect(routes.map((x) => x.path).sort()).toEqual(["/app", "/app/products/:slug"]);
  });

  it("layout bọc /users và con index/add", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/index.vue": { default: Stub },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    expect(routes).toHaveLength(1);
    expect(routes[0]!.path).toBe("/users");
    const ch = routes[0]!.children ?? [];
    expect(ch.map((c) => c.path).sort()).toEqual(["", "add"]);
  });

  it("[id]/index.vue trong users/layout", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/index.vue": { default: Stub },
      "pages/users/[id]/index.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    expect(users.children?.some((c) => c.path === ":id")).toBe(true);
  });

  it("[id].vue rút gọn (không cần thư mục [id]/)", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/index.vue": { default: Stub },
      "pages/users/[id].vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    expect(users.children?.some((c) => c.path === ":id")).toBe(true);
  });

  it("[id].vue phẳng (không có layout users)", () => {
    const glob = { "pages/users/[id].vue": { default: Stub } };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    expect(routes.some((r) => r.path === "/users/:id")).toBe(true);
  });
});
