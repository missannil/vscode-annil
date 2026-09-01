import type { A } from "hry-types";
type ValidateNotNullish<T> = A.IfSomeExtends<T, null | undefined, unknown, "参数类型必须包含 null 或 undefined">;

export function isNullish<T extends ValidateNotNullish<T>>(
  value: T,
): value is Extract<T, null | undefined> {
  return value == null || value == undefined;
}

/** -----------------test------------ */
// function getString(): string | undefined | null {
//   const random = Math.random();

//   return random > 0.5 ? "hello" : random > 0.25 ? undefined : null;
// }

// const x = getString();
// if (isNullish(x)) {
//   // x: null | undefined ✅
// } else {
//   x.toUpperCase(); // x: string ✅
// }
