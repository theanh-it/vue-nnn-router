import type { RouteRecordRaw } from "vue-router";
import type { CreateNnnRoutesOptions } from "./types";
import { createSpaNnnRoutes } from "./spaRoutes";
import {
  collectRouteNames,
  type RouterNameMap,
} from "./routeNames";

export { simplifyGlobKey } from "./globUtils";

export type CreateNnnRoutesResult = {
  routes: RouteRecordRaw[];
  routeNames: RouterNameMap;
};

/**
 * Từ map `import.meta.glob` sinh `RouteRecordRaw[]` — quy ước SPA: `index.vue`, `_layout.vue`, `_redirect.ts`, `[param]`.
 */
export function createNnnRoutes(
  globRecord: Record<string, unknown>,
  options: CreateNnnRoutesOptions = {}
): RouteRecordRaw[] {
  return createSpaNnnRoutes(globRecord, options);
}

/** Như `createNnnRoutes` + `routeNames` (camelCase key → `route.name`). */
export function createNnnRoutesWithNames(
  globRecord: Record<string, unknown>,
  options: CreateNnnRoutesOptions = {},
): CreateNnnRoutesResult {
  const routes = createNnnRoutes(globRecord, options);
  const routeNames = collectRouteNames(routes, {
    silent: options.silent,
    logger: options.logger,
  });
  return { routes, routeNames };
}
