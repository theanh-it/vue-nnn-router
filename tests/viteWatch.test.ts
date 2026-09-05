import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "vite";
import {
  vueNnnRouterNamesPlugin,
  vueNnnRouterScrollPlugin,
} from "../src/vitePlugin";

const temporaryRoots: string[] = [];

function createFixture(): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "nnn-vite-watch-")));
  temporaryRoots.push(root);
  mkdirSync(join(root, "src/pages"), { recursive: true });
  writeFileSync(
    join(root, "index.html"),
    '<script type="module" src="/src/main.ts"></script>',
  );
  writeFileSync(
    join(root, "src/main.ts"),
    [
      'import { ROUTER_NAME } from "./router/router-name";',
      'import { NNN_SCROLL } from "./router/router-scroll";',
      'export const pages = import.meta.glob("./pages/**/*.ts",',
      "  { eager: true },",
      ");",
      "console.log(ROUTER_NAME, NNN_SCROLL, pages);",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(root, "src/pages/index.ts"),
    "// defineNnnScroll({ top: 40 })\nexport default {};\n",
  );
  return root;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForBuildCount(
  getBuildCount: () => number,
  getBuildError: () => unknown,
  expected: number,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (getBuildCount() < expected) {
    const error = getBuildError();
    if (error !== undefined) throw error;
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for Vite build ${expected}`);
    }
    await delay(20);
  }
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Vite build watch", () => {
  it(
    "không rebuild vô hạn và chỉ rebuild một lần khi source page thay đổi",
    async () => {
      const root = createFixture();
      let buildCount = 0;
      let buildError: unknown;

      const result = await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [
          vueNnnRouterNamesPlugin({
            pages: "src/pages/**/*.ts",
            routesRoot: "src/pages",
          }),
          vueNnnRouterScrollPlugin({ pages: "src/pages/**/*.ts" }),
        ],
        build: {
          manifest: true,
          watch: {},
        },
      });

      if (!("on" in result) || !("close" in result)) {
        throw new Error("Vite did not return a watcher");
      }

      result.on("event", (event) => {
        if (event.code === "BUNDLE_END") buildCount++;
        if (event.code === "ERROR") buildError = event.error;
      });

      try {
        await waitForBuildCount(
          () => buildCount,
          () => buildError,
          1,
        );
        await delay(1_000);
        expect(buildCount).toBe(1);

        const manifestPath = join(root, "dist/.vite/manifest.json");
        expect(existsSync(manifestPath)).toBe(true);
        expect(readFileSync(manifestPath, "utf8")).toContain('"index.html"');
        expect(readdirSync(join(root, "dist/assets"))).toEqual(
          expect.arrayContaining([expect.stringMatching(/\.js$/)]),
        );

        writeFileSync(
          join(root, "src/pages/index.ts"),
          [
            "// defineNnnScroll({ top: 40 })",
            "export const changed = true;",
            "export default {};",
            "",
          ].join("\n"),
        );

        await waitForBuildCount(
          () => buildCount,
          () => buildError,
          2,
        );
        await delay(1_000);
        expect(buildCount).toBe(2);
        expect(
          readFileSync(join(root, "src/router/router-name.ts"), "utf8"),
        ).toContain('home: "home"');
        expect(
          readFileSync(join(root, "src/router/router-scroll.ts"), "utf8"),
        ).toContain('"src/pages/index.ts": {"top":40}');
        expect(existsSync(manifestPath)).toBe(true);
        expect(readdirSync(join(root, "dist/assets"))).toEqual(
          expect.arrayContaining([expect.stringMatching(/\.js$/)]),
        );
      } finally {
        await result.close();
      }
    },
    30_000,
  );
});
