import { describe, expect, it, vi } from "vitest";
import {
  createNnnModules,
  isEagerPageModule,
  isLazyGlobModule,
  warnIfEagerPages,
} from "../src/globModules";

describe("isLazyGlobModule", () => {
  it("nhận lazy import function", () => {
    const lazy = () => Promise.resolve({ default: {} });
    expect(isLazyGlobModule(lazy)).toBe(true);
  });

  it("eager module object không phải lazy", () => {
    expect(isLazyGlobModule({ default: {} })).toBe(false);
  });
});

describe("isEagerPageModule", () => {
  it("vue eager", () => {
    expect(isEagerPageModule("pages/about/index.vue", { default: {} })).toBe(
      true,
    );
  });

  it("vue lazy", () => {
    expect(
      isEagerPageModule("pages/about/index.vue", () => Promise.resolve({})),
    ).toBe(false);
  });

  it("bỏ qua _middleware", () => {
    expect(
      isEagerPageModule("pages/_middleware.ts", { default: () => {} }),
    ).toBe(false);
  });
});

describe("warnIfEagerPages", () => {
  it("cảnh báo khi mọi page eager", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfEagerPages({
      "pages/a.vue": { default: {} },
      "pages/b.vue": { default: {} },
    });
    expect(spy.mock.calls[0]![0]).toMatch(/eager-loaded/i);
    spy.mockRestore();
  });

  it("không cảnh báo khi có page lazy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfEagerPages({
      "pages/a.vue": { default: {} },
      "pages/b.vue": () => Promise.resolve({ default: {} }),
    });
    expect(spy.mock.calls.some((c) => String(c[0]).includes("eager-loaded"))).toBe(
      false,
    );
    spy.mockRestore();
  });

  it("cảnh báo sidecar lazy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnIfEagerPages({
      "pages/users/_middleware.ts": () => Promise.resolve({ default: () => {} }),
    });
    expect(spy.mock.calls.some((c) => String(c[0]).includes("Sidecar"))).toBe(
      true,
    );
    spy.mockRestore();
  });
});

describe("createNnnModules", () => {
  it("merge views + eager, eager override cùng key", () => {
    const lazy = () => Promise.resolve({ default: "lazy" });
    const eager = { default: "eager" };
    const merged = createNnnModules({
      views: {
        "pages/x.vue": lazy,
        "pages/_middleware.ts": lazy,
      },
      eager: {
        "pages/_middleware.ts": eager,
      },
      silent: true,
    });
    expect(merged["pages/x.vue"]).toBe(lazy);
    expect(merged["pages/_middleware.ts"]).toEqual(eager);
  });
});
