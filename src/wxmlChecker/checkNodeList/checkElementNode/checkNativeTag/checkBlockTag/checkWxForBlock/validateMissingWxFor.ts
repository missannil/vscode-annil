import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";

import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

export function validateMissingWxfor(
  allRawAttrNames: string[],
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList } = checkContext;
  const isHasWxFor = allRawAttrNames.includes("wx:for");
  if (!isHasWxFor) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTagNameRegexp("block"),
        DiagnosticErrorType.missingWxfor,
        textlines,
        startLine,
      ),
    );
  }
}
