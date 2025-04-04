import { type DiagnosticMessage } from "../../../../diagnosticFixProvider/errorType";
import { getMustacheExpressions } from "../../../../utils/getMustacheExpressions";
import type { CheckContext } from "../../../CheckContext";
import { validateExpression } from "../../../validators/validateExpression";

export function validateMustacheValue(
  mustacheValue: string,
  startLine: number,
  checkContext: CheckContext,
  validDatas: string[],
  diagnosticMsg: DiagnosticMessage,
  rawAttrName?: string,
): void {
  const { wxForInfos, textlines, diagnosticList } = checkContext;
  // 检测之前block标签中的条件属性的值
  const expressions = getMustacheExpressions(mustacheValue);
  for (const expression of expressions) {
    validateExpression(
      expression,
      validDatas,
      startLine,
      textlines,
      diagnosticList,
      diagnosticMsg,
      wxForInfos.itemNames,
      true,
      rawAttrName,
    );
  }
}
