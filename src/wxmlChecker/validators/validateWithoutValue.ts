import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { isWithoutValue } from "../../utils/isWithoutValue";
import { generateDiagnostic } from "../tools/generateDiagnostic";
import { regexpHelper } from "../tools/regexpHelper";

export function validateWithoutValue(
  rawAttrName: string,
  startLine: number,
  textlines: string[],
  diagnosticList: vscode.Diagnostic[],
  replaceCode: string = "",
): boolean {
  if (isWithoutValue(rawAttrName, textlines, startLine)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullAttrRegexp(rawAttrName),
        DiagnosticErrorType.withoutValue,
        textlines,
        startLine,
        { replaceCode },
      ),
    );

    return false;
  }

  return true;
}
