import { describe, expect, it, vi } from "vitest";
import type { RouteRecordRaw } from "vue-router";
import {
  collectRouteNames,
  formatRouterNameModule,
  routeNameToCamelKey,
} from "../src/routeNames";
import { createNnnRoutesWithNames } from "../src/createNnnRoutes";

const Stub = { template: "<div/>" };

describe("routeNameToCamelKey", () => {
  it("home giữ nguyên", () => {
    expect(routeNameToCamelKey("home")).toBe("home");
  });

  it("users-add → usersAdd", () => {
    expect(routeNameToCamelKey("users-add")).toBe("usersAdd");
  });

  it("users-id → usersId", () => {
    expect(routeNameToCamelKey("users-id")).toBe("usersId");
  });

  it("users-layout → usersLayout", () => {
    expect(routeNameToCamelKey("users-layout")).toBe("usersLayout");
  });
});

describe("collectRouteNames", () => {
  it("thu thập leaf và layout", () => {
    const routes: RouteRecordRaw[] = [
      {
        path: "/users",
        name: "users-layout",
        component: Stub,
        children: [
          { path: "", name: "users", component: Stub },
          { path: "add", name: "users-add", component: Stub },
        ],
      },
    ];
    expect(collectRouteNames(routes)).toEqual({
      usersLayout: "users-layout",
      users: "users",
      usersAdd: "users-add",
    });
  });
});

describe("formatRouterNameModule", () => {
  it("sinh export const ROUTER_NAME", () => {
    const src = formatRouterNameModule({ home: "home", usersAdd: "users-add" });
    expect(src).toContain("export const ROUTER_NAME = {");
    expect(src).toContain('home: "home"');
    expect(src).toContain('usersAdd: "users-add"');
    expect(src).toContain("export type RouterName");
  });
});

describe("createNnnRoutesWithNames", () => {
  it("trả routes + routeNames camelCase", () => {
    const glob = {
      "pages/users/_layout.vue": { default: Stub },
      "pages/users/add.vue": { default: Stub },
    };
    const { routes, routeNames } = createNnnRoutesWithNames(glob, {
      routesRoot: "pages",
      silent: true,
    });
    expect(routes).toHaveLength(1);
    expect(routeNames.usersLayout).toBe("users-layout");
    expect(routeNames.usersAdd).toBe("users-add");
  });

  it("cảnh báo key camelCase trùng từ hai route.name khác nhau", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    collectRouteNames(
      [
        { path: "/users/add", name: "users-add", component: Stub },
        { path: "/usersAdd", name: "usersAdd", component: Stub },
      ],
      { silent: false },
    );
    expect(spy.mock.calls.some((c) => String(c[0]).includes("usersAdd"))).toBe(
      true,
    );
    spy.mockRestore();
  });
});
