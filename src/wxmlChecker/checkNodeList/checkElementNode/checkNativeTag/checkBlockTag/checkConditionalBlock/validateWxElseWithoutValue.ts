import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import { isWithoutValue } from "../../../../../../utils/isWithoutValue";
import type { CheckContext } from "../../../../../CheckContext";
import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

export function validateWxElseWithoutValue(
  rawAttrName: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList } = checkContext;
  if (isWithoutValue(rawAttrName, textlines, startLine)) return true;
  diagnosticList.push(
    generateDiagnostic(
      regexpHelper.getFullAttrRegexp(rawAttrName),
      DiagnosticErrorType.valueShouldNotExist,
      textlines,
      startLine,
      { replaceCode: `wx:else` },
    ),
  );

  return false;
}
