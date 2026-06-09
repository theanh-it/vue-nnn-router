import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { globSync } from "tinyglobby";
import type { CreateNnnRoutesOptions } from "./types";
import { createSpaNnnRoutes } from "./spaRoutes";
import {
  collectRouteNames,
  formatRouterNameModule,
} from "./routeNames";

export type VueNnnRouterNamesPluginOptions = {
  /** Project root (default: Vite config root). */
  root?: string;
  /** Glob patterns for page files (relative to `root`), same coverage as `import.meta.glob`. */
  pages: string | string[];
  /** Output file path relative to `root` (default: `src/router/router-name.ts`). */
  outFile?: string;
} & Pick<CreateNnnRoutesOptions, "routesRoot" | "prefix" | "silent">;

function normalizeGlobKey(file: string): string {
  let k = file.replace(/\\/g, "/");
  while (k.startsWith("./")) k = k.slice(2);
  return k;
}

function modulesFromGlobFiles(files: string[]): Record<string, unknown> {
  const modules: Record<string, unknown> = {};
  for (const f of files) {
    const key = normalizeGlobKey(f);
    if (/_redirect\.(ts|js)$/i.test(key)) {
      /** Placeholder — route `name` only; real target comes from the app glob at runtime. */
      modules[key] = { default: "index" };
    } else {
      modules[key] = {};
    }
  }
  return modules;
}

export function generateRouterNameFile(
  options: VueNnnRouterNamesPluginOptions & { root: string },
): void {
  const patterns = Array.isArray(options.pages) ? options.pages : [options.pages];
  const files = globSync(patterns, { cwd: options.root, onlyFiles: true });
  const modules = modulesFromGlobFiles(files);
  const routes = createSpaNnnRoutes(modules, {
    routesRoot: options.routesRoot,
    prefix: options.prefix,
    silent: options.silent ?? true,
  });
  const names = collectRouteNames(routes, { silent: options.silent ?? true });
  const outFile = options.outFile ?? "src/router/router-name.ts";
  const content = formatRouterNameModule(names);
  const outPath = resolve(options.root, outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content, "utf8");
}

function shouldRegenerate(file: string): boolean {
  const n = file.replace(/\\/g, "/");
  return (
    /\/pages\//.test(n) &&
    (/\.(vue|tsx|jsx|ts|js)$/i.test(n) || /_middleware\.(ts|js)$/i.test(n) || /_redirect\.(ts|js)$/i.test(n))
  );
}

/** Vite plugin — writes `router-name.ts` (default) with camelCase keys at dev/build time. */
export function vueNnnRouterNamesPlugin(
  options: VueNnnRouterNamesPluginOptions,
): Plugin {
  let viteRoot = options.root ?? process.cwd();

  const run = () => {
    generateRouterNameFile({ ...options, root: viteRoot });
  };

  return {
    name: "vue-nnn-router-names",
    configResolved(config) {
      viteRoot = options.root ?? config.root;
    },
    buildStart() {
      run();
    },
    configureServer() {
      run();
    },
    handleHotUpdate(ctx) {
      if (shouldRegenerate(ctx.file)) {
        run();
        return ctx.modules;
      }
    },
  };
}
