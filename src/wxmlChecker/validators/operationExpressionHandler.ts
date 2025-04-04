import * as vscode from "vscode";
import type { DiagnosticMessage } from "../../diagnosticFixProvider/errorType";
import { getSubExpressions } from "../tools/getSubExpressions";
import { handlers } from "../tools/handers";
import { validateExpression } from "./validateExpression";
import { validateOperationExpressionSyntax } from "./validateOperationExpressionSyntax";

export function operationExpressionHandler(
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
    (): boolean => validateOperationExpressionSyntax(expression, textlines, startLine, diagnosticList, attrName),
    (): boolean => {
      const allSubExpressions = getSubExpressions(expression);

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
