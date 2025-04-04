import * as vscode from "vscode";
import { type DiagnosticMessage } from "../../diagnosticFixProvider/errorType";

import { getMemberExpressions } from "../tools/getMemberExpressions";
import { regexpHelper } from "../tools/regexpHelper";
import { validateExpression } from "./validateExpression";
import { validateVariableSyntax } from "./validateVariableSyntax";
import { validateVariableValidity } from "./validateVariableValidity";

export function memberVariableExpressionHandler(
  expression: string,
  validVariables: string[],
  startLine: number,
  textlines: string[],
  diagnosticList: vscode.Diagnostic[],
  wxforItems: string[],
  variableErrMsg: DiagnosticMessage,
  attrName?: string,
): boolean {
  // 获取所有成员表达式

  const memberExpressions = getMemberExpressions(expression);
  // 第一个成员一定是一个变量,验证语法和是否是合法变量
  if (memberExpressions.length === 0) {
    throw new Error("不应该没有成员表达式");
  }

  return memberExpressions.reduce((acc, memberExpression, index) => {
    if (index === 0) {
      return validateVariableSyntax(
        memberExpression,
        textlines,
        startLine,
        diagnosticList,
        regexpHelper.getMustacheValue(memberExpression, attrName),
      ) && validateVariableValidity(
        memberExpression,
        validVariables,
        textlines,
        startLine,
        diagnosticList,
        variableErrMsg,
        regexpHelper.getMustacheValue(memberExpression, attrName),
      );
    }

    return validateExpression(
      memberExpression,
      validVariables,
      startLine,
      textlines,
      diagnosticList,
      variableErrMsg,
      wxforItems,
      false,
      attrName,
    ) && acc;
  }, true);
}
