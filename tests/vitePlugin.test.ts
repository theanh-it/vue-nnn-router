import { describe, expect, it } from "vitest";
import { generateRouterNameFile } from "../src/vitePlugin";
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
});
