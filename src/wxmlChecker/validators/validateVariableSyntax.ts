import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { isVariableExpression } from "../tools/isVariableExpression";

export function validateVariableSyntax(
  variable: string,
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  regExps: RegExp[],
): boolean {
  if (!isVariableExpression(variable)) {
    diagnosticList.push(
      generateDiagnostic(
        regExps,
        DiagnosticErrorType.invalidVariable,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
