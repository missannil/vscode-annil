import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";

import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

export function validateNotFoundWxForItemAndIndex(
  attrNames: string[],
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList, wxForInfos } = checkContext;
  const hasWxForItem = attrNames.includes("wx:for-item");
  if (!hasWxForItem && wxForInfos.itemNames.includes("item")) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTagNameRegexp("block"),
        DiagnosticErrorType.repeatedWxForItemDefault,
        textlines,
        startLine,
      ),
    );
  }
  const hasWxForIndex = attrNames.includes("wx:for-index");
  if (!hasWxForIndex && wxForInfos.indexNames.includes("index")) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getTagNameRegexp("block"),
        DiagnosticErrorType.repeatedWxForIndexDefault,
        textlines,
        startLine,
      ),
    );
  }

  return true;
}
