import { describe, expect, it } from "vitest";
import {
  dynamicScore,
  isRedirectKey,
  normalizePath,
  pathFromSegments,
  redirectDirFromNormKey,
  stripRoutesRoot,
} from "../src/path";

describe("stripRoutesRoot", () => {
  it("bỏ tiền tố src/pages", () => {
    expect(stripRoutesRoot("src/pages/users/index.vue", "src/pages")).toBe(
      "users/index.vue"
    );
  });

  it("bỏ tiền tố ../pages (key glob từ src/router/)", () => {
    expect(stripRoutesRoot("../pages/users/add.vue", "../pages")).toBe(
      "users/add.vue"
    );
  });
});

describe("pathFromSegments + normalizePath", () => {
  it("ghi tiếp prefix URL", () => {
    expect(pathFromSegments(["users"], "api")).toBe("/api/users");
  });

  it("chuẩn hoá ////", () => {
    expect(normalizePath("//foo//bar//")).toBe("/foo/bar");
  });
});

describe("dynamicScore", () => {
  it("đếm tham động", () => {
    expect(dynamicScore("/users/:userId/posts/:postId")).toBe(2);
  });
});

describe("redirect key helpers", () => {
  it("nhận diện _redirect.ts", () => {
    expect(isRedirectKey("users/_redirect.ts")).toBe(true);
    expect(isRedirectKey("users/index.vue")).toBe(false);
  });

  it("lấy thư mục chứa _redirect", () => {
    expect(redirectDirFromNormKey("users/_redirect.ts")).toBe("users");
    expect(redirectDirFromNormKey("_redirect.ts")).toBe("");
  });
});
