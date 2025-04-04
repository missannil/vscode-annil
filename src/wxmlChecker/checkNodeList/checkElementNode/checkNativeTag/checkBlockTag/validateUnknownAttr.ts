import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../diagnosticFixProvider/errorType";
import type { ConditionAttrName } from "../../../../CheckContext";
import { generateDiagnostic } from "../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../tools/regexpHelper";
import { conditionalAttrs, loopAttrs } from ".";

export function validateUnknownAttr(
  attrNames: string[],
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
): string[] {
  const unknownAttrs: string[] = [];
  for (const rawAttrName of attrNames) {
    if (![...conditionalAttrs, ...loopAttrs].includes(rawAttrName as ConditionAttrName)) {
      unknownAttrs.push(rawAttrName);
      diagnosticList.push(
        generateDiagnostic(
          regexpHelper.getFullAttrRegexp(rawAttrName),
          DiagnosticErrorType.unknownAttr,
          textlines,
          startLine,
        ),
      );
    }
  }

  return unknownAttrs;
}
