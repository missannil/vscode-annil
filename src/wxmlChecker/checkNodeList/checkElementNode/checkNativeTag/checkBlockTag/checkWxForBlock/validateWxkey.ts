import type { CheckContext } from "../../../../../CheckContext";
import { regexpHelper } from "../../../../../tools/regexpHelper";
import { validateVariableSyntax } from "../../../../../validators/validateVariableSyntax";

export function validateWxkey(
  rawAttrValue: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList } = checkContext;
  if (
    rawAttrValue !== "*this" && !validateVariableSyntax(
      rawAttrValue,
      textlines,
      startLine,
      diagnosticList,
      regexpHelper.getFullValueRegexp("wx:key", rawAttrValue),
    )
  ) return false;

  return true;
}
