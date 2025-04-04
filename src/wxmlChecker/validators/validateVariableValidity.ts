import * as vscode from "vscode";
import { type DiagnosticMessage } from "../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../tools/generateDiagnostic";

export function validateVariableValidity(
  variable: string,
  legalDatas: string[],
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  errorMsg: DiagnosticMessage,
  regExps: RegExp[],
  fixValue: string = "",
): boolean {
  if (variable === "true" || variable === "false") return true;
  if (!legalDatas.includes(variable)) {
    diagnosticList.push(
      generateDiagnostic(
        regExps,
        errorMsg,
        textlines,
        startLine,
        { replaceCode: fixValue },
      ),
    );

    return false;
  }

  return true;
}
