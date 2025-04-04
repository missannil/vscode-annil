import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../tools/regexpHelper";

export function validateEventsAttr(
  rawAttrName: string,
  rawAttrValue: string,
  eventsList: string[],
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
): boolean {
  if (!eventsList.includes(rawAttrValue)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullValueRegexp(rawAttrName, rawAttrValue),
        DiagnosticErrorType.invalidEvent,
        textlines,
        startLine,
      ),
    );

    return true;
  }

  return false;
}
