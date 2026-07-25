import { describe, expect, it } from "vitest";
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalized,
} from "vue-router";
import { createNnnScrollBehavior } from "../src/scrollBehavior";

function toRoute(
  partial: Partial<RouteLocationNormalizedLoaded> = {},
): RouteLocationNormalizedLoaded {
  return {
    path: "/",
    fullPath: "/",
    hash: "",
    query: {},
    params: {},
    name: undefined,
    matched: [],
    meta: {},
    redirectedFrom: undefined,
    ...partial,
  } as RouteLocationNormalizedLoaded;
}

const from = toRoute() as RouteLocationNormalized;

describe("createNnnScrollBehavior", () => {
  it("cuộn lên đầu mặc định (auto)", () => {
    const behavior = createNnnScrollBehavior();
    const result = behavior(toRoute({ path: "/users" }), from, null);
    expect(result).toEqual({ top: 0, left: 0, behavior: "auto" });
  });

  it("smooth = true dùng behavior smooth", () => {
    const behavior = createNnnScrollBehavior({ smooth: true });
    const result = behavior(toRoute({ path: "/users" }), from, null);
    expect(result).toEqual({ top: 0, left: 0, behavior: "smooth" });
  });

  it("áp dụng offset top", () => {
    const behavior = createNnnScrollBehavior({ top: 64 });
    const result = behavior(toRoute({ path: "/users" }), from, null);
    expect(result).toEqual({ top: 64, left: 0, behavior: "auto" });
  });

  it("khôi phục savedPosition khi Back/Forward", () => {
    const behavior = createNnnScrollBehavior();
    const saved = { top: 250, left: 0 };
    const result = behavior(toRoute({ path: "/users" }), from, saved);
    expect(result).toEqual({ top: 250, left: 0, behavior: "auto" });
  });

  it("bỏ qua savedPosition khi restorePosition = false", () => {
    const behavior = createNnnScrollBehavior({ restorePosition: false });
    const saved = { top: 250, left: 0 };
    const result = behavior(toRoute({ path: "/users" }), from, saved);
    expect(result).toEqual({ top: 0, left: 0, behavior: "auto" });
  });

  it("cuộn tới hash anchor", () => {
    const behavior = createNnnScrollBehavior({ top: 10 });
    const result = behavior(
      toRoute({ path: "/docs", hash: "#section" }),
      from,
      null,
    );
    expect(result).toEqual({ el: "#section", top: 10, behavior: "auto" });
  });

  it("bỏ qua hash khi scrollToHash = false", () => {
    const behavior = createNnnScrollBehavior({ scrollToHash: false });
    const result = behavior(
      toRoute({ path: "/docs", hash: "#section" }),
      from,
      null,
    );
    expect(result).toEqual({ top: 0, left: 0, behavior: "auto" });
  });

  it("meta.noScroll = true trả về false (không cuộn)", () => {
    const behavior = createNnnScrollBehavior();
    const result = behavior(
      toRoute({ path: "/settings", meta: { noScroll: true } }),
      from,
      null,
    );
    expect(result).toBe(false);
  });

  it("skipMetaKey tùy chỉnh", () => {
    const behavior = createNnnScrollBehavior({ skipMetaKey: "keepScroll" });
    const result = behavior(
      toRoute({ path: "/settings", meta: { keepScroll: true } }),
      from,
      null,
    );
    expect(result).toBe(false);
  });

  it("skipMetaKey = false tắt hẳn opt-out", () => {
    const behavior = createNnnScrollBehavior({ skipMetaKey: false });
    const result = behavior(
      toRoute({ path: "/settings", meta: { noScroll: true } }),
      from,
      null,
    );
    expect(result).toEqual({ top: 0, left: 0, behavior: "auto" });
  });

  it("meta.nnnScroll override top + smooth theo từng trang", () => {
    const behavior = createNnnScrollBehavior();
    const result = behavior(
      toRoute({ path: "/docs", meta: { nnnScroll: { top: 80, smooth: true } } }),
      from,
      null,
    );
    expect(result).toEqual({ top: 80, left: 0, behavior: "smooth" });
  });

  it("meta.nnnScroll.enabled = false tắt cuộn cho trang", () => {
    const behavior = createNnnScrollBehavior({ top: 64 });
    const result = behavior(
      toRoute({ path: "/live", meta: { nnnScroll: { enabled: false } } }),
      from,
      null,
    );
    expect(result).toBe(false);
  });

  it("scrollMap khớp theo meta.nnnFile (đã simplify key)", () => {
    const behavior = createNnnScrollBehavior({
      scrollMap: { "src/pages/docs.vue": { top: 120 } },
    });
    const result = behavior(
      toRoute({ path: "/docs", meta: { nnnFile: "/src/pages/docs.vue" } }),
      from,
      null,
    );
    expect(result).toEqual({ top: 120, left: 0, behavior: "auto" });
  });

  it("meta.nnnScroll thắng scrollMap khi cả hai cùng có", () => {
    const behavior = createNnnScrollBehavior({
      scrollMap: { "src/pages/docs.vue": { top: 120 } },
    });
    const result = behavior(
      toRoute({
        path: "/docs",
        meta: { nnnFile: "/src/pages/docs.vue", nnnScroll: { top: 10 } },
      }),
      from,
      null,
    );
    expect(result).toEqual({ top: 10, left: 0, behavior: "auto" });
  });

  it("per-page giữ nguyên default global khi không khai báo field", () => {
    const behavior = createNnnScrollBehavior({ smooth: true, top: 50 });
    const result = behavior(
      toRoute({ path: "/docs", meta: { nnnScroll: { top: 90 } } }),
      from,
      null,
    );
    expect(result).toEqual({ top: 90, left: 0, behavior: "smooth" });
  });
});
