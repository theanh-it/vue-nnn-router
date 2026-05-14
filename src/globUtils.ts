/** Dùng chung bởi createNnnRoutes và spaRoutes. */

export function simplifyGlobKey(key: string): string {
  let k = key.replace(/\\/g, "/").split("?")[0];
  while (k.startsWith("./")) k = k.slice(2);
  return k.replace(/^\//, "");
}

export function unwrapDefault(mod: unknown): unknown {
  if (mod && typeof mod === "object" && "default" in mod) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}
