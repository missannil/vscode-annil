import type { Element } from "domhandler";
import { getVariablesFromComponentInfo } from "../../../../componentManager/tsFileManager/helper";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../../../utils/assertNonNullable";
import { checkChildNodes } from "../../../checkChildNodes";
import type { CheckContext } from "../../../CheckContext";
import { checkPendingConditionValue } from "../../checkPendingConditionValue";
import { validateAttrValue } from "./validateAttrValue";
import { validateMissingAttr } from "./validateMissingAttr";
import { validateRepeatSubComponentTag } from "./validateRepeatSubComponentTag";
import { validateUnknownAttrs } from "./validateUnknownAttrs";

export function checkCustomTag(
  elementNode: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const tagName = elementNode.name;
  // 检测之前block标签中的条件属性的值
  const { tsFileInfo, wxForInfos } = checkContext;
  checkPendingConditionValue(
    getVariablesFromComponentInfo(assertNonNullable(tsFileInfo.customComponentInfos[tagName])).concat(
      wxForInfos.itemNames,
      tsFileInfo.rootComponentInfo.dataList,
      wxForInfos.indexNames,
    ),
    DiagnosticErrorType.nonSubComponentOrWxforVariable,
    checkContext,
  );
  // 重复自定义标签的诊断
  validateRepeatSubComponentTag(elementNode, tagName, startLine, checkContext);
  // 1. 缺失属性的诊断
  const componentInfo = assertNonNullable(tsFileInfo.customComponentInfos[tagName]);
  const rawAttrNames: string[] = Object.keys(elementNode.attribs);
  const expectedAttrNames = Object.keys(componentInfo);
  validateMissingAttr(elementNode, rawAttrNames, expectedAttrNames, componentInfo, startLine, checkContext);
  for (const rawAttrName of rawAttrNames) {
    const rawAttrValue = elementNode.attribs[rawAttrName];
    if (checkContext.isIgnoreAttr(rawAttrName)) continue;

    if (
      !validateUnknownAttrs(rawAttrName, rawAttrValue, expectedAttrNames, startLine, checkContext, {
        type: "custom",
        name: tagName,
      })
    ) continue;
    // 4. 正常属性值的诊断
    validateAttrValue(
      rawAttrName,
      rawAttrValue,
      componentInfo[rawAttrName],
      startLine,
      checkContext,
    );
  }
  checkContext.saveCheckedComponentTags(tagName);

  checkChildNodes(elementNode.childNodes, checkContext);
}
