/**
 * WXML 表达式运算符常量。
 *
 * 将运算符划分为"合法"与"非法"两类：
 * - 合法：算术、比较、逻辑、三元运算符
 * - 非法：位运算、赋值、特殊运算符（typeof/delete/new 等）、空值合并、可选链
 */

// ── 算术运算符 ──
export const arithmeticOperators = ["+", "-", "*", "/", "%", "**"] as const;

// ── 比较运算符 ──
export const comparisonOperators = [">", "<", ">=", "<=", "==", "===", "!=", "!=="] as const;

// ── 逻辑运算符 ──
export const logicalOperators = ["&&", "||", "!"] as const;

// ── 三元运算符 ──
export const ternaryOperators = ["?", ":"] as const;

// ── 合法运算符集合 ──
export const legalOperators = [
  ...arithmeticOperators,
  ...comparisonOperators,
  ...logicalOperators,
  ...ternaryOperators,
];

// ── 位运算符（非法） ──
export const bitwiseOperators = ["&", "|", "^", "~", "<<", ">>", ">>>"] as const;

// ── 赋值运算符（非法） ──
export const assignmentOperators = [
  "=",
  "+=",
  "-=",
  "*=",
  "||=",
  "/=",
  "%=",
  "**=",
  "<<=",
  ">>=",
  ">>>=",
  "&=",
  "|=",
  "^=",
] as const;

// ── 特殊运算符（非法） ──
export const specialOperators = [
  "in",
  "instanceof",
  "typeof",
  "void",
  "delete",
  "new",
  "this",
  "super",
  "...",
] as const;

// ── 空值合并运算符（非法） ──
export const nullishCoalescingOperators = ["??"] as const;

// ── 可选链运算符（非法） ──
export const optionalChainingOperators = ["?."] as const;

// ── 非法运算符集合 ──
export const illegalOperators = [
  ...bitwiseOperators,
  ...assignmentOperators,
  ...specialOperators,
  ...nullishCoalescingOperators,
  ...optionalChainingOperators,
];

// ── 所有运算符按长度降序（长运算符优先匹配，如 >>> 在 > 之前） ──
export const sortedOperators = [
  ...legalOperators,
  ...illegalOperators,
].sort((a, b) => b.length - a.length);

/** 转义运算符中的正则特殊字符。 */
export function escapeOperator(operator: string): string {
  return operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
