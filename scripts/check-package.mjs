import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const packageRoot = new URL("../", import.meta.url);
const packageJson = JSON.parse(
  readFileSync(new URL("package.json", packageRoot), "utf8"),
);

function assert(condition, message) {
  if (!condition) throw new Error(`[package smoke] ${message}`);
}

for (const [subpath, entry] of Object.entries(packageJson.exports)) {
  const targets = typeof entry === "string" ? { default: entry } : entry;
  for (const [condition, target] of Object.entries(targets)) {
    if (typeof target !== "string" || !target.startsWith("./")) continue;
    assert(
      existsSync(new URL(target, packageRoot)),
      `Missing ${condition} target for ${subpath}: ${target}`,
    );
  }
}

const esmRuntime = await import(packageJson.name);
const esmProgress = await import(`${packageJson.name}/progress`);
const esmSmoothScroll = await import(`${packageJson.name}/smooth-scroll`);
const esmVite = await import(`${packageJson.name}/vite`);
const require = createRequire(import.meta.url);
const cjsRuntime = require(packageJson.name);
const cjsProgress = require(`${packageJson.name}/progress`);
const cjsSmoothScroll = require(`${packageJson.name}/smooth-scroll`);
const cjsVite = require(`${packageJson.name}/vite`);

assert(
  typeof esmRuntime.createNnnRoutes === "function",
  "ESM runtime export createNnnRoutes is missing",
);
assert(
  typeof cjsRuntime.createNnnRoutes === "function",
  "CJS runtime export createNnnRoutes is missing",
);
assert(
  typeof esmRuntime.createNnnProgress === "function",
  "ESM compatibility export createNnnProgress is missing",
);
assert(
  typeof cjsRuntime.createNnnProgress === "function",
  "CJS compatibility export createNnnProgress is missing",
);
assert(
  !("createNnnSmoothScroll" in esmRuntime),
  "ESM core unexpectedly includes optional smooth-scroll runtime",
);
assert(
  !("createNnnSmoothScroll" in cjsRuntime),
  "CJS core unexpectedly includes optional smooth-scroll runtime",
);
assert(
  typeof esmProgress.createNnnProgress === "function",
  "ESM progress subpath export is missing",
);
assert(
  typeof cjsProgress.createNnnProgress === "function",
  "CJS progress subpath export is missing",
);
assert(
  typeof esmSmoothScroll.createNnnSmoothScroll === "function",
  "ESM smooth-scroll subpath export is missing",
);
assert(
  typeof cjsSmoothScroll.createNnnSmoothScroll === "function",
  "CJS smooth-scroll subpath export is missing",
);
assert(
  typeof esmVite.vueNnnRouterNamesPlugin === "function",
  "ESM Vite plugin export is missing",
);
assert(
  typeof cjsVite.vueNnnRouterNamesPlugin === "function",
  "CJS Vite plugin export is missing",
);
assert(
  typeof esmVite.vueNnnRouterScrollPlugin === "function",
  "ESM Vite scroll plugin export is missing",
);
assert(
  typeof cjsVite.vueNnnRouterScrollPlugin === "function",
  "CJS Vite scroll plugin export is missing",
);

console.log("[package smoke] exports and artifacts are valid");
