import type { Element } from "domhandler";

import { DiagnosticErrorType } from "../../../../../diagnosticFixProvider/errorType";
import { checkChildNodes } from "../../../../checkChildNodes";
import type { CheckContext } from "../../../../CheckContext";
import { checkPendingConditionValue } from "../../../checkPendingConditionValue";
import { validateMustacheValue } from "../../checkChunkTag/validateMustacheValue";
import { validateEventsAttr } from "./validateEventsAttr";

function isEventsAttr(rawAttrName: string): boolean {
  return rawAttrName.startsWith("bind") || rawAttrName.startsWith("catch") || rawAttrName.startsWith("capture-bind")
    || rawAttrName.startsWith("capture-catch");
}

/**
 * 一些原生标签的检测,主要检测
 * @param element
 * @param startLine
 * @param checkContext
 */
export function checkOtherTag(
  element: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { tsFileInfo, wxForInfos, textlines, diagnosticList } = checkContext;
  checkPendingConditionValue(
    tsFileInfo.rootComponentInfo.dataList.concat(
      wxForInfos.itemNames,
    ).concat(wxForInfos.indexNames).concat(["true", "false"]),
    DiagnosticErrorType.nonRootComponentDataOrWxforVariable,
    checkContext,
  );
  const rawAttrNames: string[] = Object.keys(element.attribs);
  for (const rawAttrName of rawAttrNames) {
    const rawAttrValue = element.attribs[rawAttrName];
    if (checkContext.isIgnoreAttr(rawAttrName)) continue;
    if (isEventsAttr(rawAttrName)) {
      validateEventsAttr(
        rawAttrName,
        rawAttrValue,
        tsFileInfo.rootComponentInfo.events.concat(tsFileInfo.rootComponentInfo.customEvents),
        textlines,
        startLine,
        diagnosticList,
      );
      continue;
    }
    // 4. 属性值中mustache语法中表达式诊断
    validateMustacheValue(
      rawAttrValue,
      startLine,
      checkContext,
      tsFileInfo.rootComponentInfo.dataList.concat(wxForInfos.itemNames).concat(wxForInfos.indexNames),
      DiagnosticErrorType.nonRootComponentDataOrWxforVariable,
      rawAttrName,
    );
  }
  checkChildNodes(element.childNodes, checkContext);
}
