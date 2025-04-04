import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { isValidOpertionExpressionSyntax } from "../tools/isValidOpertionExpressionSyntax";
import { regexpHelper } from "../tools/regexpHelper";

// isValidOpertionExpressionSyntax("a + b");
// function isValidExpression(expression: string): boolean {
//   // 正则表达式匹配基本的运算符和数字
//   const regex = /^\s*(\d+(\.\d+)?\s*([+\-*/]\s*\d+(\.\d+)?\s*)*)\s*$/;

//   return regex.test(expression);
// }

// 示例
// console.log(isValidExpression("1 + 2 * 3 +")); // true
// console.log(isValidExpression("1 + * 2")); // false
// 是否为合法表达式(不包含非法运算符)
// export function isValidExpression(expression: string): true | LegalOperator {
//   let remainingStr = expression;

//   // 逐个匹配运算符
//   for (const operator of sortedOperators) {
// 	const escapedOperator = escapeOperator(operator); // 转义运算符
// 	const regex = new RegExp(`(^|\\s|[^\\w])${escapedOperator}($|\\s|[^\\w])`, "g"); // 添加边界

// 	if (regex.test(remainingStr)) {
// 	  // @ts-ignore
// 	  if (illegalOperators.includes(operator)) {
// 		return operator; // 如果匹配到非法运算符，返回该运算符
// 	  } else {
// 		// 如果匹配到合法运算符，移除该运算符  用一个空格替换
// 		remainingStr = remainingStr.replace(regex, " ");
// 	  }
// 	}
//   }

//   return true; // 如果没有匹配到任何非法运算符，返回 true
//   // 使用 new Function 检查表达式是否合法
//   // try {
//   //   new Function(`return ${expression}`);

//   //   return true; // 如果没有匹配到任何非法运算符，返回 true
//   // } catch {
//   //   return false;
//   // }
// }
export function validateOperationExpressionSyntax(
  mustacheValue: string,
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  attrName?: string,
): boolean {
  if (!isValidOpertionExpressionSyntax(mustacheValue)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getMustacheValue(mustacheValue, attrName),
        DiagnosticErrorType.invalidExpression,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
