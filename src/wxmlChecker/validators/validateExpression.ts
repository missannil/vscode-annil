import * as vscode from "vscode";
import { type DiagnosticMessage } from "../../diagnosticFixProvider/errorType";

import { isLikeTernaryExpression } from "../tools/getIllegalChar";
import { handlers } from "../tools/handers";
import { isMemberVariableExpression } from "../tools/isMemberVariableExpression";
import { isLikeOperationExpression } from "../tools/isValidOperationExpression";
import { regexpHelper } from "../tools/regexpHelper";

import { isVariableExpression } from "../tools/isVariableExpression";
import { generateInvalidExpression } from "./generateInvalidExpression";
import { memberVariableExpressionHandler } from "./memberVariableExpressionHandler";
import { operationExpressionHandler } from "./operationExpressionHandler";
import { ternaryExpressionHandler } from "./ternaryExpressionHandler";
import { validateHasIllegalChar } from "./validateExpressionValidity";
import { validateVariableValidity } from "./validateVariableValidity";

function isStringOrNumber(str: string): boolean {
  return /^(?:\d+|(['"]).*\1)$/.test(str);
}

function isIgnoreExpression(expression: string): boolean {
  // 忽略的表达式
  const ignoreExpressions = ["[]", "{}", "true", "false", "null", "undefined"];

  return isStringOrNumber(expression) || ignoreExpressions.includes(expression);
}

export function validateExpression(
  expression: string,
  validVariables: string[],
  startLine: number,
  textlines: string[],
  diagnosticList: vscode.Diagnostic[],
  variableErrMsg: DiagnosticMessage,
  validMemberVariable: string[],
  // 是否验证变量的合法性
  variableValidity: boolean,
  attrName?: string,
): boolean {
  return handlers([
    (): boolean => !isIgnoreExpression(expression),
    (): boolean => validateHasIllegalChar(expression, startLine, textlines, diagnosticList, attrName),
    [
      (): boolean => isLikeTernaryExpression(expression),
      (): boolean =>
        ternaryExpressionHandler(
          expression,
          validVariables,
          startLine,
          textlines,
          diagnosticList,
          variableErrMsg,
          validMemberVariable,
          attrName,
        ),
    ],
    [
      (): boolean => isLikeOperationExpression(expression),
      (): boolean =>
        operationExpressionHandler(
          expression,
          validVariables,
          startLine,
          textlines,
          diagnosticList,
          variableErrMsg,
          validMemberVariable,
          attrName,
        ),
    ],
    [
      (): boolean => isMemberVariableExpression(expression),
      (): boolean =>
        memberVariableExpressionHandler(
          expression,
          validVariables,
          startLine,
          textlines,
          diagnosticList,
          validMemberVariable,
          variableErrMsg,
          attrName,
        ),
    ],
    [
      (): boolean => isVariableExpression(expression),
      (): boolean => {
        if (variableValidity) {
          return validateVariableValidity(
            expression,
            validVariables,
            textlines,
            startLine,
            diagnosticList,
            variableErrMsg,
            regexpHelper.getMustacheValue(expression, attrName),
          );
        }

        return true;
      },
    ],
    (): boolean => {
      generateInvalidExpression(startLine, textlines, expression, diagnosticList, attrName);

      return false;
    },
  ]);
}
