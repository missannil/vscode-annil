import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";

import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

export function validateMissingWxkey(
  allRawAttrNames: string[],
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList } = checkContext;
  const isHasWxkey = allRawAttrNames.includes("wx:key");
  if (!isHasWxkey) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTagNameRegexp("block"),
        DiagnosticErrorType.missingWxkey,
        textlines,
        startLine,
      ),
    );
  }
}
