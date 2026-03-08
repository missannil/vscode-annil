import * as htmlparser2 from "htmlparser2";
import { Domhandler, vscode } from "../publicModule";
import { getBaseContent } from "./baseContent";
import { buildShouldValidateList } from "./getShouldValidateList";
import { handleCustomTag } from "./handleCustomTag";
import { handleNativeTag } from "./handleNativeTag";
import type { FileName, FileText, FsPath } from "./types";
import { capitalize, indent, isCustomTag } from "./utils";

async function getRootElementTagName(uri: vscode.Uri): Promise<string> {
  const compWxmlDocument = await vscode.workspace.openTextDocument(uri);
  const compWxmlText = compWxmlDocument.getText();
  const compWxmlParsed = htmlparser2.parseDocument(compWxmlText, {
    xmlMode: true,
    withStartIndices: false,
    withEndIndices: false,
  });
  // 获取第一个子元素类型的标签名
  const firstChildNode = compWxmlParsed.childNodes.find(node => node.type === "tag") as Domhandler.Element | undefined;
  if (!firstChildNode) {
    return "未知标签名";
  }
  // 如果第一个子元素不是block，那么认为当前元素的标签名就是根元素的标签名
  if (firstChildNode.tagName !== "block") {
    return firstChildNode.tagName;
  } else {
    // 如果根元素是block，那么获取block的第一个子元素的标签名作为根元素标签名
    const firstChildElement = firstChildNode.childNodes.find(node => node.type === "tag") as
      | Domhandler.Element
      | undefined;

    return firstChildElement?.tagName ?? "未知标签名";
  }
}

// 获取自定义组件的根元素的标签名和自定义组件名(有可能当前文件的自定义组件标签名是通过json文件配置后映射的，不是原本的自定义组件名)
type CustomCompName = string;
type RootElementTagName = string;
type CustomCompNameAndRootElementTageName = [CustomCompName, RootElementTagName];

/**
 * 获取自定义组件的根元素的标签名和自定义组件名
 * @param wxmlFsPath 当前文件的路径
 * @param cusTomCompTagName 自定义组件的标签名
 * @returns [自定义组件名，根元素的标签名]
 */
async function getCustomCompNameAndRootElementTageName(
  wxmlFsPath: FsPath,
  cusTomCompTagName: string,
): Promise<CustomCompNameAndRootElementTageName> {
  const res: CustomCompNameAndRootElementTageName = ["未知组件名", "未知标签名"];
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
    const hasIndexTail = tail === "index";
    const compFileName = hasIndexTail ? compPathParts[lenth - 2] : tail;
    res[0] = compFileName;
    // 去除 compPathParts 中的..和.路径，得到相对于工作区根路径的路径，再从这个路径中找到对应的wxml文件，解析出根元素标签名
    let validCustomCompPathParts = compPathParts.filter(part => part !== ".." && part !== ".").join("/"); // 变为 miniprogram/components/subA/index
    if (hasIndexTail) {
      validCustomCompPathParts = validCustomCompPathParts.replace(/\/index$/, "");
    }
    // 从当前工作区的根路径下搜索查找到 validCustomCompPathParts目录下的*.wxml文件路径，读取其中的根元素标签名
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return res;
    }
    const workspaceRootPath = workspaceFolders[0].uri.fsPath;
    const pattern = new vscode.RelativePattern(workspaceRootPath, `**/${validCustomCompPathParts}/*.wxml`);
    // 从工作区中找到匹配的文件
    const files = await vscode.workspace.findFiles(pattern);
    if (files.length === 0) {
      return res;
    }
    const rootElementTagName = await getRootElementTagName(files[0]);
    res[1] = rootElementTagName;

    return res;
  } catch (error) {
    return res;
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
      const [customCompName, rootElementTagName] = await getCustomCompNameAndRootElementTageName(fsPath, tagName);
      handleCustomTag(tagInfo, context, customComponents, customCompName, rootElementTagName);
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
