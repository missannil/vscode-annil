// 算术运算符
export const arithmeticOperators = ["+", "-", "*", "/", "%", "**"] as const;

// 比较运算符
export const comparisonOperators = [">", "<", ">=", "<=", "==", "===", "!=", "!=="] as const;

// 逻辑运算符
export const logicalOperators = ["&&", "||", "!"] as const;

// 位运算符
export const bitwiseOperators = ["&", "|", "^", "~", "<<", ">>", ">>>"] as const;

// 赋值运算符
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

// 条件（三元）运算符
export const ternaryOperators = ["?", ":"] as const;

// 特殊运算符
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

// 空值合并运算符
export const nullishCoalescingOperators = ["??"] as const;

// 可选链运算符
export const optionalChainingOperators = ["?."] as const;

// 合法的运算符包含:算术运算符, 比较运算符, 逻辑运算符,三元运算符
export const legalOperators = [
  ...arithmeticOperators,
  ...comparisonOperators,
  ...logicalOperators,
  ...ternaryOperators,
];

// 非法的运算符包含: 位运算符, 赋值运算符, 特殊运算符, 空值合并运算符, 可选链运算符
export const illegalOperators = [
  ...bitwiseOperators,
  ...assignmentOperators,
  ...specialOperators,
  ...nullishCoalescingOperators,
  ...optionalChainingOperators,
];

// 转义运算符中的特殊字符
export function escapeOperator(operator: string): string {
  return operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
