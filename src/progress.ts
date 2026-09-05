import type { Router } from "vue-router";

export interface NnnProgressOptions {
  /** Bật progress bar. `false` không đăng ký router hook hay tạo DOM. */
  enabled?: boolean;
  /** Màu của thanh progress. */
  color?: string;
  /** Độ dày CSS; number được hiểu là pixel. */
  height?: number | string;
  /** Hiện ở cạnh trên hoặc dưới viewport. */
  position?: "top" | "bottom";
  /** Chỉ hiện nếu navigation còn chạy sau khoảng này, giúp tránh nhấp nháy. */
  delay?: number;
  /** Thời gian tối thiểu thanh đã hiện trước khi chạy animation hoàn tất. */
  minimumVisible?: number;
  /** z-index của progress bar. */
  zIndex?: number;
}

export interface NnnProgressHandle {
  /** Gỡ router hooks, huỷ timer và xoá progress bar khỏi DOM. */
  destroy(): void;
}

const DEFAULT_COLOR = "#ff4d00";
const DEFAULT_HEIGHT = 3;
const DEFAULT_DELAY = 120;
const DEFAULT_MINIMUM_VISIBLE = 0;
const DEFAULT_Z_INDEX = 2_147_483_647;

function nonNegative(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

function cssHeight(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(0, value)}px`;
  }
  return typeof value === "string" && value.trim()
    ? value.trim()
    : `${DEFAULT_HEIGHT}px`;
}

/**
 * Gắn một progress bar nhẹ vào vòng đời navigation của Vue Router.
 *
 * Thanh chỉ được tạo sau `delay`, nên các navigation nhanh không chạm DOM.
 * Gọi `destroy()` khi router không còn được sử dụng (ví dụ trong test/HMR).
 */
export function createNnnProgress(
  router: Router,
  options: NnnProgressOptions = {},
): NnnProgressHandle {
  if (options.enabled === false || typeof document === "undefined") {
    return { destroy() {} };
  }

  const delay = nonNegative(options.delay, DEFAULT_DELAY);
  const minimumVisible = nonNegative(
    options.minimumVisible,
    DEFAULT_MINIMUM_VISIBLE,
  );
  const color = options.color?.trim() || DEFAULT_COLOR;
  const position = options.position === "bottom" ? "bottom" : "top";
  const zIndex =
    typeof options.zIndex === "number" && Number.isFinite(options.zIndex)
    ? Math.trunc(options.zIndex)
    : DEFAULT_Z_INDEX;

  let bar: HTMLDivElement | undefined;
  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let finishTimer: ReturnType<typeof setTimeout> | undefined;
  let removeTimer: ReturnType<typeof setTimeout> | undefined;
  let advanceFrame: number | undefined;
  let shownAt = 0;
  let latestNavigation = 0;
  let destroyed = false;
  const navigationTokens = new WeakMap<object, number>();

  const view = document.defaultView;
  const requestFrame = (callback: FrameRequestCallback): number =>
    view?.requestAnimationFrame
      ? view.requestAnimationFrame(callback)
      : (setTimeout(() => callback(Date.now()), 16) as unknown as number);
  const cancelFrame = (id: number): void => {
    if (view?.cancelAnimationFrame) view.cancelAnimationFrame(id);
    else clearTimeout(id);
  };

  function clearTimer(
    timer: ReturnType<typeof setTimeout> | undefined,
  ): undefined {
    if (timer !== undefined) clearTimeout(timer);
    return undefined;
  }

  function removeBar(): void {
    if (advanceFrame !== undefined) {
      cancelFrame(advanceFrame);
      advanceFrame = undefined;
    }
    bar?.remove();
    bar = undefined;
    shownAt = 0;
  }

  function mountBar(): void {
    delayTimer = undefined;
    if (destroyed || bar) return;

    const element = document.createElement("div");
    element.setAttribute("data-nnn-progress", "");
    element.setAttribute("aria-hidden", "true");
    Object.assign(element.style, {
      position: "fixed",
      left: "0",
      right: "0",
      [position]: "0",
      width: "100%",
      height: cssHeight(options.height),
      backgroundColor: color,
      boxShadow: `0 0 8px ${color}, 0 0 3px ${color}`,
      opacity: "1",
      pointerEvents: "none",
      transform: "scaleX(0)",
      transformOrigin: "left center",
      transition: "none",
      willChange: "transform, opacity",
      zIndex: String(zIndex),
    });

    (document.body ?? document.documentElement).appendChild(element);
    bar = element;
    shownAt = Date.now();

    // Chỉ một frame để trình duyệt ghi nhận trạng thái đầu; chuyển động sau đó
    // chạy bằng CSS/compositor, không cần polling hay interval.
    advanceFrame = requestFrame(() => {
      advanceFrame = undefined;
      if (bar !== element) return;
      element.style.transition =
        "transform 12s cubic-bezier(0.1, 0.5, 0.1, 1)";
      // Dynamic import không cung cấp byte progress: tiến ước lượng tới 90%,
      // sau đó `finish()` mới đưa thanh lên đúng 100%.
      element.style.transform = "scaleX(0.9)";
    });
  }

  function start(): void {
    finishTimer = clearTimer(finishTimer);
    removeTimer = clearTimer(removeTimer);

    if (bar) {
      // Navigation mới bắt đầu trong lúc animation hoàn tất của navigation cũ.
      bar.style.transition = "opacity 80ms linear";
      bar.style.opacity = "1";
      if (bar.style.transform === "scaleX(1)") {
        bar.style.transition = "none";
        bar.style.transform = "scaleX(0)";
        advanceFrame = requestFrame(() => {
          advanceFrame = undefined;
          if (!bar) return;
          bar.style.transition =
            "transform 12s cubic-bezier(0.1, 0.5, 0.1, 1)";
          bar.style.transform = "scaleX(0.9)";
        });
      }
      return;
    }

    delayTimer = clearTimer(delayTimer);
    if (delay === 0) mountBar();
    else delayTimer = setTimeout(mountBar, delay);
  }

  function finish(): void {
    delayTimer = clearTimer(delayTimer);
    if (!bar) return;
    if (finishTimer !== undefined || removeTimer !== undefined) return;

    const remaining = Math.max(0, minimumVisible - (Date.now() - shownAt));
    finishTimer = setTimeout(() => {
      finishTimer = undefined;
      if (!bar || destroyed) return;

      if (advanceFrame !== undefined) {
        cancelFrame(advanceFrame);
        advanceFrame = undefined;
      }
      bar.style.transition =
        "transform 160ms ease-out, opacity 120ms ease-out 140ms";
      bar.style.transform = "scaleX(1)";
      bar.style.opacity = "0";
      removeTimer = setTimeout(() => {
        removeTimer = undefined;
        removeBar();
      }, 280);
    }, remaining);
  }

  const removeBeforeEach = router.beforeEach((to) => {
    latestNavigation += 1;
    navigationTokens.set(to, latestNavigation);
    start();
  });

  const removeAfterEach = router.afterEach((to) => {
    // Không để afterEach của navigation cũ/cancelled tắt navigation mới hơn.
    if (navigationTokens.get(to) === latestNavigation) finish();
  });

  const removeOnError = router.onError((_error, to) => {
    if (!to || navigationTokens.get(to) === latestNavigation) finish();
  });

  return {
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      removeBeforeEach();
      removeAfterEach();
      removeOnError();
      delayTimer = clearTimer(delayTimer);
      finishTimer = clearTimer(finishTimer);
      removeTimer = clearTimer(removeTimer);
      removeBar();
    },
  };
}
