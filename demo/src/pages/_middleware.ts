import type {
  NavigationGuardNext,
  RouteLocationNormalized,
} from "vue-router";

/**
 * Middleware gốc: chạy trước mọi route dưới pages/.
 */
export default function rootMiddleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (import.meta.env.DEV) {
    console.log("[demo root _middleware]", to.fullPath);
  }
  next();
}
