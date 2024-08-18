import { isTernaryExpression } from "./isTernaryExpression";

export type TernaryValue = {
  condition: string;
  trueValue: TernaryValue | string;
  falseValue: TernaryValue | string;
};
type OuterTernary = {
  condition: string;
  trueValue: string;
  falseValue: string;
};

/**
 * 提取最外层的三元表达式的条件, 真值, 假值
 * @param expression 字符串表达式
 * @returns  三元表达式的值
 */
function extractOuterTernary(expression: string): OuterTernary {
  let questionMarkCount = 0;
  let colonCount = 0;
  // 第一个问号的位置
  let firstQuestionMarkIndex = -1;
  let colonIndex = -1;

  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === "?") {
      questionMarkCount++;

      if (questionMarkCount === 1) {
        // 记录第一个问号的位置
        firstQuestionMarkIndex = i;
      }
    } else if (expression[i] === ":") {
      colonCount++;

      if (questionMarkCount === colonCount) {
        colonIndex = i;

        break;
      }
    }
  }
  const condition = expression.substring(0, firstQuestionMarkIndex).trim();
  const trueValue = expression
    .substring(firstQuestionMarkIndex + 1, colonIndex)
    .trim();
  const falseValue = expression.substring(colonIndex + 1).trim();

  return {
    condition,
    trueValue,
    falseValue,
  };
}

/**
 * 获取字符串中所有三元表达式的值
 * @param expression 字符串表达式
 * @returns 三元表达式的值
 */
export function getTernaryValue(expression: string): TernaryValue {
  // 获取最外层的三元表达式的条件, 真值, 假值
  const { condition, trueValue, falseValue } = extractOuterTernary(expression);

  return {
    condition,
    trueValue: isTernaryExpression(trueValue) ? getTernaryValue(trueValue) : trueValue,
    falseValue: isTernaryExpression(falseValue) ? getTernaryValue(falseValue) : falseValue,
  };
}
