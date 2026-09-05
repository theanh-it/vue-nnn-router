import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryHistory,
  createRouter,
  type Router,
} from "vue-router";
import { createNnnProgress } from "../src/progress";

type FakeElement = {
  attributes: Record<string, string>;
  children: FakeElement[];
  parent?: FakeElement;
  style: Record<string, string>;
  appendChild(child: FakeElement): FakeElement;
  remove(): void;
  setAttribute(name: string, value: string): void;
};

function fakeElement(): FakeElement {
  return {
    attributes: {},
    children: [],
    style: {},
    appendChild(child) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    remove() {
      if (!this.parent) return;
      this.parent.children = this.parent.children.filter((child) => child !== this);
      this.parent = undefined;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function fakeDocument() {
  const body = fakeElement();
  return {
    body,
    documentElement: fakeElement(),
    defaultView: undefined,
    createElement: () => fakeElement(),
  };
}

type BeforeHook = (to: object) => unknown;
type AfterHook = (to: object) => unknown;
type ErrorHook = (error: unknown, to?: object) => unknown;

function fakeRouter() {
  const beforeHooks: BeforeHook[] = [];
  const afterHooks: AfterHook[] = [];
  const errorHooks: ErrorHook[] = [];

  function register<T>(hooks: T[], hook: T): () => void {
    hooks.push(hook);
    return () => {
      const index = hooks.indexOf(hook);
      if (index >= 0) hooks.splice(index, 1);
    };
  }

  const router = {
    beforeEach: (hook: BeforeHook) => register(beforeHooks, hook),
    afterEach: (hook: AfterHook) => register(afterHooks, hook),
    onError: (hook: ErrorHook) => register(errorHooks, hook),
  } as unknown as Router;

  return { router, beforeHooks, afterHooks, errorHooks };
}

describe("createNnnProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("enabled=false không đăng ký hook hoặc tạo DOM", () => {
    const { router, beforeHooks, afterHooks, errorHooks } = fakeRouter();
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);

    createNnnProgress(router, { enabled: false });

    expect(beforeHooks).toHaveLength(0);
    expect(afterHooks).toHaveLength(0);
    expect(errorHooks).toHaveLength(0);
    expect(doc.body.children).toHaveLength(0);
  });

  it("không tạo DOM khi navigation hoàn tất trước delay", () => {
    const { router, beforeHooks, afterHooks } = fakeRouter();
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);
    createNnnProgress(router, { delay: 100 });
    const to = {};

    beforeHooks[0]!(to);
    vi.advanceTimersByTime(99);
    afterHooks[0]!(to);
    vi.runAllTimers();

    expect(doc.body.children).toHaveLength(0);
  });

  it("render fixed bar và hoàn tất navigation chậm", () => {
    const { router, beforeHooks, afterHooks } = fakeRouter();
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);
    createNnnProgress(router, {
      color: "#123456",
      height: 4,
      delay: 100,
    });
    const to = {};

    beforeHooks[0]!(to);
    vi.advanceTimersByTime(100);

    expect(doc.body.children).toHaveLength(1);
    const bar = doc.body.children[0]!;
    expect(bar.attributes["data-nnn-progress"]).toBe("");
    expect(bar.style.position).toBe("fixed");
    expect(bar.style.top).toBe("0");
    expect(bar.style.height).toBe("4px");
    expect(bar.style.backgroundColor).toBe("#123456");
    expect(bar.style.transform).toBe("scaleX(0)");

    vi.advanceTimersByTime(16);
    expect(bar.style.transform).toBe("scaleX(0.9)");

    afterHooks[0]!(to);
    vi.advanceTimersByTime(0);
    expect(bar.style.transform).toBe("scaleX(1)");
    vi.advanceTimersByTime(280);
    expect(doc.body.children).toHaveLength(0);
  });

  it("navigation cũ hoàn tất không được tắt navigation mới", () => {
    const { router, beforeHooks, afterHooks } = fakeRouter();
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);
    createNnnProgress(router, { delay: 0, minimumVisible: 0 });
    const oldRoute = {};
    const newRoute = {};

    beforeHooks[0]!(oldRoute);
    vi.advanceTimersByTime(0);
    beforeHooks[0]!(newRoute);
    afterHooks[0]!(oldRoute);
    vi.advanceTimersByTime(0);

    const bar = doc.body.children[0]!;
    expect(bar.style.transform).not.toBe("scaleX(1)");

    afterHooks[0]!(newRoute);
    vi.advanceTimersByTime(0);
    expect(bar.style.transform).toBe("scaleX(1)");
  });

  it("giữ progress trong lúc lazy component pending và hoàn tất cùng router", async () => {
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);
    let resolveView!: (component: { default: object }) => void;
    let loadCalls = 0;
    const lazyView = () => {
      loadCalls += 1;
      return new Promise<{ default: object }>((resolve) => {
        resolveView = resolve;
      });
    };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/lazy", component: lazyView }],
    });
    createNnnProgress(router, { delay: 0 });

    const navigation = router.push("/lazy");
    await vi.advanceTimersByTimeAsync(0);

    expect(loadCalls).toBe(1);
    expect(doc.body.children).toHaveLength(1);
    expect(doc.body.children[0]!.style.transform).not.toBe("scaleX(1)");

    resolveView({ default: {} });
    await navigation;
    vi.advanceTimersByTime(0);

    expect(doc.body.children[0]!.style.transform).toBe("scaleX(1)");
  });

  it("destroy gỡ hooks, timer và DOM", () => {
    const { router, beforeHooks, afterHooks, errorHooks } = fakeRouter();
    const doc = fakeDocument();
    vi.stubGlobal("document", doc);
    const progress = createNnnProgress(router, { delay: 0 });

    beforeHooks[0]!({});
    vi.advanceTimersByTime(0);
    expect(doc.body.children).toHaveLength(1);

    progress.destroy();

    expect(beforeHooks).toHaveLength(0);
    expect(afterHooks).toHaveLength(0);
    expect(errorHooks).toHaveLength(0);
    expect(doc.body.children).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
