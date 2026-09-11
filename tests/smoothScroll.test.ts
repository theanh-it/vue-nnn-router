import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

const lenisMock = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>;
    destroy: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("lenis", () => ({
  default: class MockLenis {
    options: Record<string, unknown>;
    destroy = vi.fn();

    constructor(options: Record<string, unknown>) {
      this.options = options;
      lenisMock.instances.push(this);
    }
  },
}));

import { createNnnSmoothScroll } from "../src/smoothScroll";

function toRoute(
  meta: Record<string, unknown> = {},
): RouteLocationNormalizedLoaded {
  return {
    path: "/",
    fullPath: "/",
    hash: "",
    query: {},
    params: {},
    name: undefined,
    matched: [],
    meta,
    redirectedFrom: undefined,
  } as RouteLocationNormalizedLoaded;
}

function stubBrowser(width: number) {
  let matches = width <= 767;
  let changeListener: (() => void) | undefined;
  const removeEventListener = vi.fn();
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      changeListener = listener;
    }),
    removeEventListener,
  };

  vi.stubGlobal("window", {
    innerWidth: width,
    matchMedia: vi.fn(() => media),
  });

  return {
    media,
    setMobile(value: boolean) {
      matches = value;
      changeListener?.();
    },
  };
}

function stubRouter(meta: Record<string, unknown> = {}) {
  let afterHook: (() => void) | undefined;
  const removeHook = vi.fn();
  const currentRoute = { value: toRoute(meta) };
  const router = {
    currentRoute,
    afterEach: vi.fn((hook: () => void) => {
      afterHook = hook;
      return removeHook;
    }),
  } as unknown as Router;

  return {
    router,
    removeHook,
    navigate(nextMeta: Record<string, unknown>) {
      currentRoute.value = toRoute(nextMeta);
      afterHook?.();
    },
  };
}

afterEach(() => {
  lenisMock.instances.length = 0;
  vi.unstubAllGlobals();
});

describe("createNnnSmoothScroll", () => {
  it("creates Lenis with an owned auto RAF loop", () => {
    stubBrowser(1280);
    const { router } = stubRouter();
    const handle = createNnnSmoothScroll(router, {
      lenisOptions: { lerp: 0.08, smoothWheel: true },
    });

    expect(handle.active).toBe(true);
    expect(lenisMock.instances).toHaveLength(1);
    expect(lenisMock.instances[0]?.options).toEqual({
      lerp: 0.08,
      smoothWheel: true,
      autoRaf: true,
    });
  });

  it("switches between Lenis and native scrolling per page", () => {
    stubBrowser(1280);
    const route = stubRouter({ nnnFile: "/src/pages/native.vue" });
    const handle = createNnnSmoothScroll(route.router, {
      scrollMap: {
        "src/pages/native.vue": { enabled: false },
        "src/pages/smooth.vue": { enabled: true },
      },
    });

    expect(handle.active).toBe(false);
    route.navigate({ nnnFile: "/src/pages/smooth.vue" });
    expect(handle.active).toBe(true);
    const instance = lenisMock.instances[0]!;

    route.navigate({ nnnFile: "/src/pages/native.vue" });
    expect(handle.active).toBe(false);
    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it("uses native scrolling on mobile and reacts to breakpoint changes", () => {
    const viewport = stubBrowser(390);
    const { router } = stubRouter();
    const handle = createNnnSmoothScroll(router, {
      disableOnMobile: true,
    });

    expect(handle.active).toBe(false);
    viewport.setMobile(false);
    expect(handle.active).toBe(true);
    const instance = lenisMock.instances[0]!;

    viewport.setMobile(true);
    expect(handle.active).toBe(false);
    expect(instance.destroy).toHaveBeenCalledOnce();
  });

  it("allows a page to override the global mobile policy", () => {
    stubBrowser(390);
    const { router } = stubRouter({
      nnnSmoothScroll: { enabled: true, disableOnMobile: false },
    });
    const handle = createNnnSmoothScroll(router, {
      disableOnMobile: true,
    });

    expect(handle.active).toBe(true);
  });

  it("cleans up its instance and subscriptions idempotently", () => {
    const viewport = stubBrowser(1280);
    const route = stubRouter();
    const handle = createNnnSmoothScroll(route.router);
    const instance = lenisMock.instances[0]!;

    handle.destroy();
    handle.destroy();

    expect(instance.destroy).toHaveBeenCalledOnce();
    expect(route.removeHook).toHaveBeenCalledOnce();
    expect(viewport.media.removeEventListener).toHaveBeenCalledOnce();
    expect(handle.active).toBe(false);
  });

  it("does not instantiate Lenis during SSR", () => {
    const route = stubRouter();
    const handle = createNnnSmoothScroll(route.router);

    expect(handle.active).toBe(false);
    expect(lenisMock.instances).toHaveLength(0);
    handle.destroy();
    expect(route.removeHook).toHaveBeenCalledOnce();
  });
});
