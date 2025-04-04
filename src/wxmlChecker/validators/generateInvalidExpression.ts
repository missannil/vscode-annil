import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { regexpHelper } from "../tools/regexpHelper";

export function generateInvalidExpression(
  startLine: number,
  textlines: string[],
  expression: string,
  diagnosticList: vscode.Diagnostic[],
  attrName?: string,
): void {
  diagnosticList.push(
    generateDiagnostic(
      regexpHelper.getMustacheValue(expression, attrName),
      DiagnosticErrorType.invalidExpression,
      textlines,
      startLine,
    ),
  );
}
