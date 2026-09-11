import type { NnnSmoothScrollMeta } from "./smoothScrollMeta";
import { normalizeNnnSmoothScroll } from "./smoothScrollMeta";
import { evalLiteralConfigArg, findCallArg } from "./scrollExtract";

export function findNnnSmoothScrollArg(code: string): string | null {
  return findCallArg(code, "defineNnnSmoothScroll");
}

export function evalNnnSmoothScrollArg(
  arg: string | null,
): NnnSmoothScrollMeta | null {
  return evalLiteralConfigArg(arg, normalizeNnnSmoothScroll);
}

export function extractNnnSmoothScroll(
  code: string,
): NnnSmoothScrollMeta | null {
  return evalNnnSmoothScrollArg(findNnnSmoothScrollArg(code));
}
