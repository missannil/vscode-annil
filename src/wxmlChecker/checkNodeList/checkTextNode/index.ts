import type { Text } from "domhandler";
import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import { getMustacheExpressions } from "../../../utils/getMustacheExpressions";
import type { CheckContext } from "../../CheckContext";
import { getLegalVariables } from "../../tools/getLegalVariables";
import { validateExpression } from "../../validators/validateExpression";

export function checkTextNode(
  textNode: Text,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList, wxForInfos } = checkContext;
  const text = textNode.data.trim();
  if (text == "") return;
  const expressions = getMustacheExpressions(text);
  if (expressions.length > 0) {
    for (const expression of expressions) {
      validateExpression(
        expression,
        getLegalVariables(checkContext),
        startLine,
        textlines,
        diagnosticList,
        DiagnosticErrorType.nonSubComponentOrWxforVariable,
        wxForInfos.itemNames,
        true,
      );
    }
  }
}
