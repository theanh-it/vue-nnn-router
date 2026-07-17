import { describe, expect, it } from "vitest";
import {
  generateRouterNameFile,
  vueNnnRouterNamesPlugin,
} from "../src/vitePlugin";
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("generateRouterNameFile", () => {
  it("ghi router-name.ts từ cấu trúc pages", () => {
    const root = mkdtempSync(join(tmpdir(), "nnn-names-"));
    try {
      mkdirSync(join(root, "src/pages/users"), { recursive: true });
      writeFileSync(join(root, "src/pages/users/_layout.vue"), "<template/>");
      writeFileSync(join(root, "src/pages/users/add.vue"), "<template/>");
      writeFileSync(join(root, "src/pages/users/_redirect.ts"), "export default 'add'");

      generateRouterNameFile({
        root,
        pages: ["src/pages/**/*.vue", "src/pages/**/_redirect.ts"],
        routesRoot: "src/pages",
        outFile: "src/router/router-name.ts",
        silent: true,
      });

      const content = readFileSync(
        join(root, "src/router/router-name.ts"),
        "utf8",
      );
      expect(content).toContain("usersLayout");
      expect(content).toContain("usersAdd");
      expect(content).toContain("usersRedirect");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("default outFile là src/router/router-name.ts", () => {
    const root = mkdtempSync(join(tmpdir(), "nnn-names-default-"));
    try {
      mkdirSync(join(root, "src/pages"), { recursive: true });
      writeFileSync(join(root, "src/pages/index.vue"), "<template/>");

      generateRouterNameFile({
        root,
        pages: ["src/pages/**/*.vue"],
        routesRoot: "src/pages",
        silent: true,
      });

      expect(
        readFileSync(join(root, "src/router/router-name.ts"), "utf8"),
      ).toContain("home:");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("HMR theo pages glob tùy chỉnh, kể cả khi file đã bị xóa", () => {
    const root = mkdtempSync(join(tmpdir(), "nnn-names-hmr-"));
    try {
      const viewsDir = join(root, "src/views");
      mkdirSync(viewsDir, { recursive: true });
      writeFileSync(join(viewsDir, "index.vue"), "<template/>");

      const plugin = vueNnnRouterNamesPlugin({
        root,
        pages: "src/views/**/*.vue",
        routesRoot: "src/views",
        outFile: "src/router/router-name.ts",
        silent: true,
      });
      const hooks = plugin as unknown as {
        configureServer: () => void;
        handleHotUpdate: (ctx: {
          file: string;
          modules: unknown[];
        }) => unknown;
      };

      hooks.configureServer();

      const accountFile = join(viewsDir, "account.vue");
      writeFileSync(accountFile, "<template/>");
      const modules = [{ id: "account" }];
      expect(hooks.handleHotUpdate({ file: accountFile, modules })).toBe(
        modules,
      );

      const outFile = join(root, "src/router/router-name.ts");
      expect(readFileSync(outFile, "utf8")).toContain(
        'account: "account"',
      );

      rmSync(accountFile);
      hooks.handleHotUpdate({ file: accountFile, modules: [] });
      expect(readFileSync(outFile, "utf8")).not.toContain(
        'account: "account"',
      );

      const beforeIgnoredUpdate = readFileSync(outFile, "utf8");
      const ignoredFile = join(root, "src/other/ignored.vue");
      mkdirSync(join(root, "src/other"), { recursive: true });
      writeFileSync(ignoredFile, "<template/>");
      expect(
        hooks.handleHotUpdate({ file: ignoredFile, modules: [] }),
      ).toBeUndefined();
      expect(readFileSync(outFile, "utf8")).toBe(beforeIgnoredUpdate);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
