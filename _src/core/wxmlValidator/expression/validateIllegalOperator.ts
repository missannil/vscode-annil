import { escapeOperator, illegalOperators, sortedOperators } from "./allOperators.js";

/**
 * 检测 `{{}}` 表达式中的非法运算符。
 *
 * 合法运算符（算术、比较、逻辑、三元）在检测时被移除；
 * 当匹配到非法运算符（位运算、赋值、typeof/delete、可选链等）时，
 * 返回该运算符供调用方生成诊断。
 *
 * @returns 非法运算符字符串，无非法运算符时返回 null
 */
export function findIllegalOperator(expression: string): string | null {
  let remainingStr = expression;

  for (const operator of sortedOperators) {
    const escapedOp = escapeOperator(operator);
    const regex = new RegExp(`(^|\\s|[^\\w])${escapedOp}($|\\s|[^\\w])`, "g");

    if (!regex.test(remainingStr)) continue;

    if ((illegalOperators as readonly string[]).includes(operator)) {
      return operator;
    } else {
      // 合法运算符 → 从字符串中移除，避免干扰后续匹配
      remainingStr = remainingStr.replace(regex, " ");
    }
  }

  return null;
}
