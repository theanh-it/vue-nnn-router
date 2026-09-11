import { describe, expect, it } from "vitest";
import {
  evalNnnSmoothScrollArg,
  extractNnnSmoothScroll,
  findNnnSmoothScrollArg,
} from "../src/smoothScrollExtract";
import {
  defineNnnSmoothScroll,
  normalizeNnnSmoothScroll,
  toNnnSmoothScrollMeta,
} from "../src/smoothScrollMeta";

const sfc = (body: string) =>
  `<script setup lang="ts">\n${body}\n</script>\n<template><div /></template>\n`;

describe("smooth-scroll page config", () => {
  it("extracts an object literal", () => {
    const code = sfc(
      "defineNnnSmoothScroll({ enabled: true, disableOnMobile: true });",
    );
    expect(findNnnSmoothScrollArg(code)).toBe(
      "{ enabled: true, disableOnMobile: true }",
    );
    expect(extractNnnSmoothScroll(code)).toEqual({
      enabled: true,
      disableOnMobile: true,
    });
  });

  it("normalizes a boolean literal", () => {
    expect(evalNnnSmoothScrollArg("false")).toEqual({ enabled: false });
    expect(defineNnnSmoothScroll(true)).toEqual({ enabled: true });
  });

  it("rejects dynamic and unsafe expressions", () => {
    expect(evalNnnSmoothScrollArg("config")).toBeNull();
    expect(
      evalNnnSmoothScrollArg("{ enabled: window.innerWidth > 700 }"),
    ).toBeNull();
  });

  it("supports normalization and manual route meta", () => {
    expect(normalizeNnnSmoothScroll({ disableOnMobile: true })).toEqual({
      disableOnMobile: true,
    });
    expect(toNnnSmoothScrollMeta(false)).toEqual({
      nnnSmoothScroll: { enabled: false },
    });
  });
});
