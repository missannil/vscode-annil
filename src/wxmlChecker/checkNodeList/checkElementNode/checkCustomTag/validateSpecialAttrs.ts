import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { getMustacheExpressions } from "../../../../utils/getMustacheExpressions";
import type { CheckContext } from "../../../CheckContext";
import { validateExpression } from "../../../validators/validateExpression";
const specialAttrs = ["twClass", "style"];

export function specialAttrsHandle(
  rawAttrName: string,
  rawAttrValue: string,
  validVariables: string[],
  expectedAttrNames: string[],
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList, wxForInfos } = checkContext;
  if (specialAttrs.includes(rawAttrName) && !expectedAttrNames.includes(rawAttrName)) {
    const expressions = getMustacheExpressions(rawAttrValue);
    expressions.forEach((expression) => {
      validateExpression(
        expression,
        validVariables,
        startLine,
        textlines,
        diagnosticList,
        DiagnosticErrorType.nonSubComponentOrWxforVariable,
        wxForInfos.itemNames,
        true,
        rawAttrName,
      );
    });

    return false;
  }

  return true;
}
