import { arithmeticOperators, comparisonOperators, logicalOperators } from "./allOperators";

const legalOperators = [
  // 算术运算符
  ...arithmeticOperators,
  // 比较运算符
  ...comparisonOperators,
  // 逻辑运算符
  ...logicalOperators,
];

// 检查是否包含至少一个合法运算符(非三元运算符)
export function isLikeOperationExpression(expression: string): boolean {
  return legalOperators.some((op) => expression.includes(op));
}

// // 测试用例
// const testCases = [
//   "a + b", // true
//   "a + 1bb", // false
//   "a === b", // true
//   "a === b === c", // true
//   "a > b", // true
//   "a > b > c", // true
//   "a > b === c", // true
//   "a > b + c", // true
//   "a + b > c", // true
//   "a + (b * c)", // true
//   "a + (b * c))", // false
//   "a + b @ c", // false
// ];

// // 测试
// testCases.forEach((testCase) => {
//   console.log(`${testCase}: ${isValidOperationExpression(testCase)}`);
// });
