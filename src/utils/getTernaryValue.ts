import { isValidTernaryExpressionSyntax } from "../wxmlChecker/tools/isValidTernaryExpressionSyntax";

export type TernaryInfo = {
  conditions: string[];
  trueBranches: string[];
  falseBranches: string[];
};
type OuterTernary = {
  condition: string;
  trueBranche: string;
  falseBranche: string;
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
    trueBranche: trueValue,
    falseBranche: falseValue,
  };
}

function _getTernaryExpressionInfo(expression: string, result: TernaryInfo): TernaryInfo {
  // 获取最外层的三元表达式的条件, 真值, 假值
  const { condition, trueBranche: trueValue, falseBranche: falseValue } = extractOuterTernary(expression);

  result.conditions.push(condition);
  // 递归获取下一个三元表达式
  if (isValidTernaryExpressionSyntax(trueValue)) {
    _getTernaryExpressionInfo(trueValue, result);
  } else {
    result.trueBranches.push(trueValue);
  }
  if (isValidTernaryExpressionSyntax(falseValue)) {
    _getTernaryExpressionInfo(falseValue, result);
  } else {
    result.falseBranches.push(falseValue);
  }

  return result;
}

/**
 * 获取字符串中所有三元表达式的值(条件, 真值, 假值),递归获取，值不会在包含三元表达式
 * @param expression 字符串表达式
 * @returns 三元表达式的值
 */
export function getTernaryExpressionInfo(expression: string): TernaryInfo {
  return _getTernaryExpressionInfo(expression, { conditions: [], trueBranches: [], falseBranches: [] });
}
