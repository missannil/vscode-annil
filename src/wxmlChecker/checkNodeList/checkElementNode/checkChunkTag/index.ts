import type { Element } from "domhandler";

import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../../../utils/assertNonNullable";
import { isEventAttr } from "../../../../utils/isEventAttr";
import { checkChildNodes } from "../../../checkChildNodes";
import type { CheckContext } from "../../../CheckContext";
import { checkPendingConditionValue } from "../../checkPendingConditionValue";
import { validateRepeatSubComponentTag } from "../checkCustomTag/validateRepeatSubComponentTag";
import { validateEventsAttr } from "../checkNativeTag/checkOtherTag/validateEventsAttr";
import { validateMustacheValue } from "./validateMustacheValue";

export function checkChunkTag(
  elementNode: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const chunkTagMark = checkContext.getChunkTagMark(elementNode);
  const { tsFileInfo, wxForInfos, textlines, diagnosticList } = checkContext;
  checkContext.saveChunkTagMark(chunkTagMark);
  // 检测之前block标签中的条件属性的值
  checkPendingConditionValue(
    assertNonNullable(tsFileInfo.chunkComopnentInfos[chunkTagMark]).dataList.concat(
      wxForInfos.itemNames,
      wxForInfos.indexNames,
      tsFileInfo.rootComponentInfo.dataList,
      ["true", "false"],
    ),
    DiagnosticErrorType.nonSubComponentOrWxforVariable,
    checkContext,
  );
  // 重复自定义标签的诊断
  validateRepeatSubComponentTag(elementNode, elementNode.attribs.id, startLine, checkContext);
  const rawAttrNames: string[] = Object.keys(elementNode.attribs);
  for (const rawAttrName of rawAttrNames) {
    const rawAttrValue = elementNode.attribs[rawAttrName];
    // 包含`data-`开头的属性或是未知的属性(有诊断)
    if (checkContext.isIgnoreAttr(rawAttrName)) continue;
    if (isEventAttr(rawAttrName)) {
      validateEventsAttr(
        rawAttrName,
        rawAttrValue,
        tsFileInfo.chunkComopnentInfos[chunkTagMark]?.events || [],
        textlines,
        startLine,
        diagnosticList,
      );
      continue;
    }
    validateMustacheValue(
      rawAttrValue,
      startLine,
      checkContext,
      checkContext.getOuterChunkTagVariables().concat(
        wxForInfos.itemNames,
        wxForInfos.indexNames,
        tsFileInfo.rootComponentInfo.dataList,
      ),
      DiagnosticErrorType.invalidValue,
      rawAttrName,
    );
  }
  checkContext.saveCheckedComponentTags(chunkTagMark);
  checkChildNodes(elementNode.childNodes, checkContext);
  checkContext.popChunkTagMarks();
}
