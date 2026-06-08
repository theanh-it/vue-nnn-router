import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";

export default function usersSectionMiddleware(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (import.meta.env.DEV) {
    console.log("[demo settings/_middleware]", to.fullPath);
  }
  next();
}
