import type { RouteRecordRaw } from "vue-router";
import type { CreateNnnRoutesOptions } from "./types";
import { createSpaNnnRoutes } from "./spaRoutes";

export { simplifyGlobKey } from "./globUtils";

/**
 * Từ map `import.meta.glob` sinh `RouteRecordRaw[]` — quy ước SPA: `index.vue`, `_layout.vue`, `_redirect.ts`, `[param]`.
 */
export function createNnnRoutes(
  globRecord: Record<string, unknown>,
  options: CreateNnnRoutesOptions = {}
): RouteRecordRaw[] {
  return createSpaNnnRoutes(globRecord, options);
}
