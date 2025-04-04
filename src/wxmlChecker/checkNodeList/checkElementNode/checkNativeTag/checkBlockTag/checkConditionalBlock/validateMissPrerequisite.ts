import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";
import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

// 缺少先决条件: 属性为`wx:elif` || `wx:else`时如果最后的lastConditionState中值null或为wx:else,这两个属性是缺少先决条件的)
export function validateMissPrerequisite(
  rawAttrName: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, preConditionAttrName, diagnosticList } = checkContext;
  if (["wx:elif", "wx:else"].includes(rawAttrName) && (preConditionAttrName === null)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullAttrRegexp(rawAttrName),
        DiagnosticErrorType.missPrerequisite,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
