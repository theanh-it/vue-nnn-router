import { describe, expect, it } from "vitest";
import {
  extractNnnScroll,
  findNnnScrollArg,
  evalNnnScrollArg,
  formatScrollMapModule,
} from "../src/scrollExtract";
import { defineNnnScroll, normalizeNnnScroll, toNnnScrollMeta } from "../src/scrollMeta";

const sfc = (body: string) =>
  `<script setup lang="ts">\nimport { defineNnnScroll } from "vue-nnn-router";\n${body}\n</script>\n<template><div /></template>\n`;

describe("findNnnScrollArg", () => {
  it("lấy object literal có nested braces", () => {
    const arg = findNnnScrollArg(
      sfc("defineNnnScroll({ top: 80, nested: { a: 1 } });"),
    );
    expect(arg).toBe("{ top: 80, nested: { a: 1 } }");
  });

  it("bỏ qua dấu ngoặc trong string", () => {
    const arg = findNnnScrollArg(sfc('defineNnnScroll({ id: ")" });'));
    expect(arg).toBe('{ id: ")" }');
  });

  it("trả null khi không có lời gọi", () => {
    expect(findNnnScrollArg(sfc("const x = 1;"))).toBeNull();
  });
});

describe("evalNnnScrollArg", () => {
  it("đọc object literal", () => {
    expect(evalNnnScrollArg("{ top: 80, smooth: true }")).toEqual({
      top: 80,
      smooth: true,
    });
  });

  it("đọc boolean false → enabled:false", () => {
    expect(evalNnnScrollArg("false")).toEqual({ enabled: false });
  });

  it("từ chối biểu thức động / không an toàn", () => {
    expect(evalNnnScrollArg("{ top: window.innerHeight }")).toBeNull();
    expect(evalNnnScrollArg("{ f: () => 1 }")).toBeNull();
    expect(evalNnnScrollArg("someVar")).toBeNull();
    expect(evalNnnScrollArg("")).toBeNull();
    expect(evalNnnScrollArg(null)).toBeNull();
  });
});

describe("extractNnnScroll", () => {
  it("end-to-end từ nội dung SFC", () => {
    expect(extractNnnScroll(sfc("defineNnnScroll({ top: 64 });"))).toEqual({
      top: 64,
    });
  });

  it("null khi trang không khai báo", () => {
    expect(extractNnnScroll(sfc("const n = 1;"))).toBeNull();
  });
});

describe("formatScrollMapModule", () => {
  it("emit module hợp lệ, key sắp xếp", () => {
    const src = formatScrollMapModule({
      "src/pages/b.vue": { top: 10 },
      "src/pages/a.vue": { enabled: false },
    });
    expect(src).toContain(
      'import type { NnnScrollMap, NnnSmoothScrollMap } from "vue-nnn-router";',
    );
    expect(src).toContain("export const NNN_SCROLL: NnnScrollMap = {");
    expect(src).toContain(
      "export const NNN_SMOOTH_SCROLL: NnnSmoothScrollMap = {",
    );
    expect(src.indexOf("a.vue")).toBeLessThan(src.indexOf("b.vue"));
  });

  it("map rỗng vẫn hợp lệ", () => {
    const src = formatScrollMapModule({});
    expect(src).toContain("export const NNN_SCROLL: NnnScrollMap = {");
  });
});

describe("defineNnnScroll / helpers", () => {
  it("defineNnnScroll trả config đã chuẩn hoá", () => {
    expect(defineNnnScroll({ top: 80 })).toEqual({ top: 80 });
    expect(defineNnnScroll(false)).toEqual({ enabled: false });
  });

  it("normalizeNnnScroll xử lý boolean", () => {
    expect(normalizeNnnScroll(true)).toEqual({ enabled: true });
  });

  it("toNnnScrollMeta bọc vào namespace nnnScroll", () => {
    expect(toNnnScrollMeta({ top: 80 })).toEqual({
      nnnScroll: { top: 80 },
    });
  });
});
