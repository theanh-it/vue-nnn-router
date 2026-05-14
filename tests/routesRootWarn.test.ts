import { describe, expect, it, vi } from "vitest";
import { warnIfRoutesRootLikelyWrong } from "../src/spaRouteGenerator";

describe("warnIfRoutesRootLikelyWrong", () => {
  it("cảnh báo khi stripped key vẫn chứa '..' và routesRoot đã set", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfRoutesRootLikelyWrong(
      [{ sk: "../pages/index.vue" }],
      "pages",
      false
    );
    expect(spy.mock.calls[0]![0]).toMatch(/routesRoot/);
    spy.mockRestore();
  });

  it("không cảnh báo khi silent: true", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfRoutesRootLikelyWrong(
      [{ sk: "../pages/index.vue" }],
      "pages",
      true
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("không cảnh báo khi routesRoot khớp (strip sạch '..')", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfRoutesRootLikelyWrong(
      [{ sk: "users/index.vue" }],
      "../pages",
      false
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("không cảnh báo khi không đặt routesRoot", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfRoutesRootLikelyWrong([{ sk: "../pages/x.vue" }], undefined, false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
