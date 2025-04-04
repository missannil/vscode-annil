import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext, ConditionAttrName } from "../../../../../CheckContext";
import { generateDiagnostic } from "../../../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../../../tools/regexpHelper";

import { conditionalAttrs } from "..";

// 互斥的属性检测 (wx:if 、 wx:elif 、 wx:else 三个条件属性是互斥的,不能同时存在,如果同时存在多个，除了第一个属性外,后面的其他都属性报错,并返回第一个属性)
export function checkMutuallyExclusiveAttrs(
  allRawAttrNames: string[],
  startLine: number,
  checkContext: CheckContext,
): ConditionAttrName {
  const { textlines, diagnosticList } = checkContext;
  const conditionAttrs = allRawAttrNames.filter((rawAttrName) =>
    conditionalAttrs.includes(rawAttrName as ConditionAttrName)
  );
  // 不存在没有条件属性(之前的检测会提前报错，根本就不到这里)。
  if (conditionAttrs.length === 0) {
    throw new Error("不可能没有条件属性的,有条件属性逻辑才可以到这里");
  }
  // 除了第一个条件属性外,认为其他的条件属性都是错误属性
  const mutuallyExclusiveAttrs = conditionAttrs.slice(1);
  for (const conditionAttr of mutuallyExclusiveAttrs) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullAttrRegexp(conditionAttr),
        DiagnosticErrorType.conditionalAttrExisted,
        textlines,
        startLine,
      ),
    );
  }

  return allRawAttrNames[0] as ConditionAttrName;
}
