import * as htmlparser2 from "htmlparser2";
import { getBaseContent } from "./baseContent";
import { buildShouldValidateList } from "./getShouldValidateList";
import { handleCustomTag } from "./handleCustomTag";
import { handleNativeTag } from "./handleNativeTag";
import type { FileName, FileText } from "./types";
import { capitalize, indent, isCustomTag } from "./utils";

export function generateTestFileContent(fileName: FileName, text: FileText): string {
  const wxmlDocument = htmlparser2.parseDocument(text, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true,
  });
  const shouldValidateList = buildShouldValidateList({
    childNodes: wxmlDocument.childNodes,
    isRootBlock: true,
    isRootElement: true,
    blockType: [],
    result: [],
  });
  const context = getBaseContent(fileName);
  const getComopnentInfo = [
    `${indent}def getComponentInfo(self) -> ${capitalize(fileName)}ComponentInfo:`,
    `${indent}${indent}return {`,
    `${indent}${indent}}`,
  ];
  // 属于在getComopnentInfo中的字段
  const customComponents = [
    `${indent}${indent}${indent}"customComponents": {`,
    `${indent}${indent}${indent}},`,
  ];
  for (const tagInfo of shouldValidateList) {
    if (isCustomTag(tagInfo.element.tagName)) {
      handleCustomTag(fileName, tagInfo, context, customComponents);
    } else {
      // 处理原生标签的属性和事件，生成组件信息和测试方法
      handleNativeTag(fileName, tagInfo, context, getComopnentInfo);
    }
  }
  getComopnentInfo.splice(-1, 0, ...customComponents);
  context.testClass.push(...getComopnentInfo);

  return Object.values(context).flat().join("\n");
}
