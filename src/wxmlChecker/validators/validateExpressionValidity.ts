import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { getIllegalChar } from "../tools/getIllegalChar";
import { regexpHelper } from "../tools/regexpHelper";

export function validateHasIllegalChar(
  expression: string,
  startLine: number,
  textlines: string[],
  diagnosticList: vscode.Diagnostic[],
  attrName?: string,
): boolean {
  const res = getIllegalChar(expression);
  if (res !== null) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getMustacheValue(res, attrName),
        DiagnosticErrorType.illegalOperator,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
