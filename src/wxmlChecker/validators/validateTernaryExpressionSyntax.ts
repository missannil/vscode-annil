import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { isValidTernaryExpressionSyntax } from "../tools/isValidTernaryExpressionSyntax";

export function validateTernaryExpressionSyntax(
  mustacheValue: string,
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  regExps: RegExp[],
  replaceCode: string = "",
): boolean {
  if (!isValidTernaryExpressionSyntax(mustacheValue)) {
    diagnosticList.push(
      generateDiagnostic(
        regExps,
        DiagnosticErrorType.invalidTernaryExpression,
        textlines,
        startLine,
        { replaceCode },
      ),
    );

    return false;
  }

  return true;
}
