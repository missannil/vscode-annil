import type { DiagnosticMessage } from "../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../CheckContext";
import { validateExpression } from "../validators/validateExpression";

export function checkPendingConditionValue(
  validVariables: string[],
  variableErrMsg: DiagnosticMessage,
  checkContext: CheckContext,
): void {
  const { pendingConditionBlockInfo, textlines, diagnosticList, wxForInfos } = checkContext;
  if (pendingConditionBlockInfo !== null) {
    checkContext.pendingConditionBlockInfo = null;
    const { conditionAttrName, mustacheValue, startLine } = pendingConditionBlockInfo;
    validateExpression(
      mustacheValue,
      validVariables,
      startLine,
      textlines,
      diagnosticList,
      variableErrMsg,
      wxForInfos.itemNames,
      true,
      conditionAttrName,
    );
  }
}
