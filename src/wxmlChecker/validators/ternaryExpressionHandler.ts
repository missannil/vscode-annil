import type { DiagnosticMessage } from "../../diagnosticFixProvider/errorType";
import { getTernaryExpressionInfo } from "../../utils/getTernaryValue";

import { handlers } from "../tools/handers";
import { regexpHelper } from "../tools/regexpHelper";
import { validateExpression } from "./validateExpression";

import { validateTernaryExpressionSyntax } from "./validateTernaryExpressionSyntax";

import * as vscode from "vscode";

export function ternaryExpressionHandler(
  expression: string,
  validVariables: string[],
  startLine: number,
  textlines: string[],
  diagnosticList: vscode.Diagnostic[],
  variableErrMsg: DiagnosticMessage,
  validMemberVariable: string[],
  attrName?: string,
): boolean {
  return handlers([
    (): boolean =>
      validateTernaryExpressionSyntax(
        expression,
        textlines,
        startLine,
        diagnosticList,
        regexpHelper.getMustacheValue(expression, attrName),
      ),
    (): boolean => {
      const { conditions, trueBranches, falseBranches } = getTernaryExpressionInfo(expression);
      const allSubExpressions = conditions.concat(trueBranches).concat(falseBranches);

      return allSubExpressions.reduce((acc, noTernaryExpression) => {
        return validateExpression(
          noTernaryExpression,
          validVariables,
          startLine,
          textlines,
          diagnosticList,
          variableErrMsg,
          validMemberVariable,
          true,
          attrName,
        ) && acc;
      }, true);
    },
  ]);
}
