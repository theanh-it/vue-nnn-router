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

  it("_redirect.ts khi layout không có index (đường dẫn tương đối)", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/_redirect.ts": { default: "add" },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    const indexRedirect = users.children?.find((c) => c.path === "");
    expect(indexRedirect?.redirect).toBe("/users/add");
  });

  it("_redirect.ts với URL tuyệt đối", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/_redirect.ts": { default: "/users/add" },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    expect(users.children?.find((c) => c.path === "")?.redirect).toBe("/users/add");
  });

  it("có index.vue thì không dùng _redirect", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/_redirect.ts": { default: "add" },
      "pages/users/index.vue": { default: Stub },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    expect(users.children?.some((c) => c.path === "" && c.redirect)).toBe(false);
    expect(users.children?.some((c) => c.path === "" && c.component)).toBe(true);
  });

  it("_redirect tương đối với prefix", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/_redirect.ts": { default: "add" },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      prefix: "/app",
      silent: true,
    });
    const users = routes.find((r) => r.path === "/app/users")!;
    expect(users.children?.find((c) => c.path === "")?.redirect).toBe("/app/users/add");
  });

  it("root layout + _redirect khi không có index", () => {
    const glob = {
      "pages/_layout.vue": { default: Stub },
      "pages/_redirect.ts": { default: "about" },
      "pages/about/index.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    expect(routes).toHaveLength(1);
    expect(routes[0]!.children?.find((c) => c.path === "")?.redirect).toBe("/about");
  });

  it("_redirect invalid export thì không sinh redirect child", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/_redirect.ts": { default: 42 },
      "pages/users/add.vue": { default: Stub },
    };
    const routes = createNnnRoutes(glob, {
      routesRoot: "pages",
      silent: true,
    });
    const users = routes[0]!;
    expect(users.children?.some((c) => c.path === "" && c.redirect)).toBe(false);
  });

  it("cảnh báo khi _redirect không có _layout", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    createNnnRoutes(
      {
        "pages/users/_redirect.ts": { default: "add" },
        "pages/users/add.vue": { default: Stub },
      },
      { routesRoot: "pages", silent: false },
    );
    expect(spy.mock.calls.some((c) => String(c[0]).includes("_layout"))).toBe(
      true,
    );
    spy.mockRestore();
  });
});
