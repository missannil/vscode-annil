import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";

import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";
import { validateVariableSyntax } from "../../../../../validators/validateVariableSyntax";

export function validateWxForItemAndIndex(
  rawAttrName: string,
  rawAttrValue: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList, wxForInfos } = checkContext;
  if (
    !validateVariableSyntax(
      rawAttrValue,
      textlines,
      startLine,
      diagnosticList,
      regexpHelper.getFullValueRegexp(rawAttrName, rawAttrValue),
    )
  ) return false;
  // 是否与之前的wx:for-item或wx:for-index变量名重复
  const preWxforVariables = wxForInfos.itemNames.concat(wxForInfos.indexNames);
  if (preWxforVariables.includes(rawAttrValue)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullValueRegexp(rawAttrName, rawAttrValue),
        rawAttrName === "wx:for-item"
          ? DiagnosticErrorType.repeatedWxForItem
          : DiagnosticErrorType.repeatedWxForIndex,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
