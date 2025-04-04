import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../diagnosticFixProvider/errorType";

import type { PreConditionAttrName } from "../../../../CheckContext";
import { generateDiagnostic } from "../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../tools/regexpHelper";

export function validateEmptyAttr(
  attrs: string[],
  textlines: string[],
  startLine: number,
  preConditionState: PreConditionAttrName,
  diagnosticList: vscode.Diagnostic[],
): boolean {
  if (attrs.length === 0) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTagNameRegexp("block"),
        DiagnosticErrorType.emptyBlockTag,
        textlines,
        startLine,
        { conditionState: preConditionState },
      ),
    );

    return false;
  }

  return true;
}
