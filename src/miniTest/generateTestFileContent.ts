import * as htmlparser2 from "htmlparser2";
import { vscode } from "../publicModule";
import { getBaseContent } from "./baseContent";
import { buildShouldValidateList } from "./getShouldValidateList";
import { handleCustomTag } from "./handleCustomTag";
import { handleNativeTag } from "./handleNativeTag";
import type { FileName, FileText, FsPath } from "./types";
import { capitalize, indent, isCustomTag } from "./utils";

/**
 * 获取自定义组件的根元素的标签名和自定义组件名
 * @param wxmlFsPath 当前文件的路径
 * @param cusTomCompTagName 自定义组件的标签名
 * @returns [自定义组件名，根元素的标签名]
 */
async function getCustomCompNameAndRootElementTageName(wxmlFsPath: FsPath, cusTomCompTagName: string): Promise<string> {
  // const res: CustomCompNameAndRootElementTageName = ["未知组件名", "未知标签名"];
  try {
    // 找到当前文件同目录下的json文件，从自定义组件路径分析出自定义组件名
    const jsonFilePath = wxmlFsPath.replace(/\.wxml$/, ".json");
    const jsonDocument = await vscode.workspace.openTextDocument(jsonFilePath);
    const text = jsonDocument.getText();
    const json: {
      usingComponents?: Record<string, string>;
    } = JSON.parse(text);
    // 从usingComponents中获取自定义组件的路径
    const compPath = json.usingComponents?.[cusTomCompTagName];
    // 从compPath的最后二段路径名可以得知文件名比如../../miniprogram/components/subA/index，如果最后一段是index，那么组件名就是倒数第二段，否则组件名就是最后一段。
    const compPathParts = compPath?.split("/") ?? [];
    const lenth = compPathParts.length;
    const tail = compPathParts[lenth - 1];
    const compFileName = tail === "index" ? compPathParts[lenth - 2] : tail;

    return compFileName;
  } catch (error) {
    return "未知标签名";
  }
}

export async function generateTestFileContent(fsPath: FsPath, dirName: FileName, text: FileText): Promise<string> {
  // 解析text
  const wxmlDocument = htmlparser2.parseDocument(text, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true,
  });
  // 构建需要验证的标签列表，包含标签的层级关系和位置信息等
  const shouldValidateList = buildShouldValidateList({
    childNodes: wxmlDocument.childNodes,
    isRootBlock: true,
    isRootElement: true,
    blockType: [],
    result: [],
  });
  // 构建测试文件的内容
  const context = getBaseContent(dirName);
  const getComopnentInfo = [
    `${indent}def getComponentInfo(self) -> ${capitalize(dirName)}ComponentInfo:`,
    `${indent}${indent}return {`,
    `${indent}${indent}}`,
  ];
  // 独立的customComponents便于处理
  const customComponents = [
    `${indent}${indent}${indent}"customComponents": {`,
    `${indent}${indent}${indent}},`,
  ];
  // 遍历shouldValidateList，处理每个标签
  for (const tagInfo of shouldValidateList) {
    const { element: { tagName } } = tagInfo;
    if (isCustomTag(tagName)) {
      //  得到自定义组件的组件名和根元素标签名。
      const customCompName = await getCustomCompNameAndRootElementTageName(fsPath, tagName);
      handleCustomTag(tagInfo, context, customComponents, customCompName);
    } else {
      // 处理原生标签的属性和事件，生成组件信息和测试方法
      handleNativeTag(dirName, tagInfo, context, getComopnentInfo);
    }
  }

  if (customComponents.length > 2) {
    // 将customComponents插入到getComponentInfo方法中
    getComopnentInfo.splice(-1, 0, ...customComponents);
  }
  context.testClass.push(...getComopnentInfo);
  context.testClass.push(
    `${indent}def assertComponentInfo(self, expectedInfo: Partial${capitalize(dirName)}ComponentInfo) -> None:`,
    `${indent}${indent}actual_info = self.getComponentInfo()`,
    `${indent}${indent}self._assertComponentInfo(dict(actual_info), dict(expectedInfo))`,
  );

  return Object.values(context).flat().join("\n");
}
