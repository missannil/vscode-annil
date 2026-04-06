import * as htmlparser2 from "htmlparser2";
import { Domhandler, vscode } from "../publicModule";
import { logError, logInfo, logWarn } from "../utils/logger";
import { getBaseContent } from "./baseContent";
import { buildShouldValidateList } from "./getShouldValidateList";
import { handleCustomTag } from "./handleCustomTag";
import { handleNativeTag } from "./handleNativeTag";
import type { ComponentName, FileText, FsPath, MethodsRecord } from "./types";
import { capitalize, indent, isCustomTag } from "./utils";

async function getRootElementTagName(uri: vscode.Uri): Promise<string> {
  logInfo(`[miniTest] 正在解析自定义组件根元素标签名: ${uri.fsPath}`);
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
    logWarn(`[miniTest] 根节点未找到元素标签: ${uri.fsPath}`);

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
    logWarn(
      `[miniTest] 根节点为 block，使用首个子元素作为根标签: ${uri.fsPath}, ${
        firstChildElement?.tagName ?? "未知标签名"
      }`,
    );

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
    // 去除 compPathParts 中的..和.路径，并去除最后的文件名，剩下的路径即为自定义组件所在的目录  变为 miniprogram/components/subA
    const validCustomCompDirPath = compPathParts.filter(part => part !== ".." && part !== ".").slice(0, -1).join("/");
    // 从当前工作区的根路径下搜索查找到 validCustomCompDirPath目录下的*.wxml文件路径，读取其中的根元素标签名
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      logError(`[miniTest] 获取工作区根路径失败: ${wxmlFsPath}`);

      return res;
    }
    const workspaceRootPath = workspaceFolders[0].uri.fsPath;
    const normalizedDir = validCustomCompDirPath.replace(/^\/+/, ""); // 去掉开头的斜杠
    const pattern = new vscode.RelativePattern(workspaceRootPath, `**/${normalizedDir}/*.wxml`);
    // 从工作区中找到匹配的文件
    const files = await vscode.workspace.findFiles(pattern);

    if (files.length === 0) {
      logError(`[miniTest] 查找自定义组件文件: ${pattern.pattern}, 找到 ${files.length} 个文件`);

      return res;
    }
    const rootElementTagName = await getRootElementTagName(files[0]);
    res[1] = rootElementTagName;

    return res;
  } catch (error) {
    logError(`[miniTest] 获取自定义组件信息失败: ${wxmlFsPath}, ${cusTomCompTagName}, 错误信息:`, error);

    return res;
  }
}

/**
 * 生成py文件的内容
 * @param wxmlFsPath 当前wxml文件的路径
 * @param componentName 自定义组件的名称，
 * @param wxmlText 当前wxml文件的文本内容，用于解析出标签信息
 * @returns 要py文件的文本内容
 */
export async function generateTextForPy(
  wxmlFsPath: FsPath,
  componentName: ComponentName,
  wxmlText: FileText,
): Promise<string> {
  // htmlparser2解析能力符合小程序wxml的书写方式。
  const wxmlDocument = htmlparser2.parseDocument(wxmlText, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true,
  });
  // 构建需要验证的标签列表，包含标签的层级关系和位置信息等
  const shouldValidateTagList = buildShouldValidateList({
    childNodes: wxmlDocument.childNodes,
    isRootBlock: true,
    isRootElement: true,
    scopeType: [],
    tagInfoList: [],
  });
  // 构建测试文件的内容
  const context = getBaseContent(componentName);
  const getComopnentInfo = [
    `${indent}def getComponentInfo(self) -> ${capitalize(componentName)}ComponentInfo:`,
    `${indent}${indent}return {`,
    `${indent}${indent}}`,
  ];
  // 独立的customComponents便于处理
  const customComponents = [
    `${indent}${indent}${indent}"customComponents": {`,
    `${indent}${indent}${indent}},`,
  ];
  // 记录各个字段信息的获取方法和参数,便于assertComponentInfo中调用 [string,string]中第一个是方法名,第二个是参数字符串
  const methodsRecord: MethodsRecord = {};
  // 遍历shouldValidateList，处理每个标签
  for (const tagInfo of shouldValidateTagList) {
    const { element: { tagName } } = tagInfo;
    if (isCustomTag(tagName)) {
      //  得到自定义组件的组件名和根元素标签名。
      const [customCompName, rootElementTagName] = await getCustomCompNameAndRootElementTageName(wxmlFsPath, tagName);
      handleCustomTag(tagInfo, context, customComponents, customCompName, rootElementTagName, methodsRecord);
    } else {
      // 处理原生标签的属性和事件，生成组件信息和测试方法
      handleNativeTag(componentName, tagInfo, context, getComopnentInfo, methodsRecord);
    }
  }

  if (customComponents.length > 2) {
    // 将customComponents插入到getComponentInfo方法中
    getComopnentInfo.splice(-1, 0, ...customComponents);
  }
  // 将记录获取组件信息方法的字符串添加到测试类中
  const methodsRecordEntries = Object.entries(methodsRecord);
  if (methodsRecordEntries.length > 0) {
    context.testClass.push(
      `${indent}def methodsRecord(self) -> dict:`,
      `${indent}${indent}return {`,
      ...methodsRecordEntries.map(([key, [methodStr, argStr]]) =>
        `${indent}${indent}${indent}"${key}": ["${methodStr}","${argStr}"],`
      ),
      `${indent}${indent}}`,
    );
  }
  context.testClass.push(...getComopnentInfo);
  // 判断 partialComponentInfo 是否包含 customComponents 字段
  const hasCustomComponents = Array.isArray(context.partialComponentInfo)
    ? context.partialComponentInfo.some((line) => line.includes("customComponents"))
    : false;
  // 生成 assertComponentInfo 方法
  if (hasCustomComponents) {
    context.testClass.push(
      `${indent}def assertComponentInfo(`,
      `${indent}${indent}self,`,
      `${indent}${indent}expectedInfo: Partial${capitalize(componentName)}ComponentInfo,`,
      `${indent}${indent}diffConfig: DiffConfig | None = None,`,
      `${indent}) -> None:`,
      `${indent}${indent}methods_record = self.methodsRecord()`,
      `${indent}${indent}actual_info :dict = {}`,
      `${indent}${indent}for key in expectedInfo:`,
      `${indent}${indent}${indent}if key == "customComponents":`,
      `${indent}${indent}${indent}${indent}actual_info["customComponents"] = {}`,
      `${indent}${indent}${indent}${indent}for comp_key in expectedInfo["customComponents"]:`,
      `${indent}${indent}${indent}${indent}${indent}if comp_key in methods_record:`,
      `${indent}${indent}${indent}${indent}${indent}${indent}method_name, arg = methods_record[comp_key]`,
      `${indent}${indent}${indent}${indent}${indent}${indent}if arg:`,
      `${indent}${indent}${indent}${indent}${indent}${indent}${indent}actual_info["customComponents"][comp_key] = getattr(self, method_name)(cid=arg)`,
      `${indent}${indent}${indent}${indent}${indent}${indent}else:`,
      `${indent}${indent}${indent}${indent}${indent}${indent}${indent}actual_info["customComponents"][comp_key] = getattr(self, method_name)()`,
      `${indent}${indent}${indent}else:`,
      `${indent}${indent}${indent}${indent}if key in methods_record:`,
      `${indent}${indent}${indent}${indent}${indent}method_name, arg = methods_record[key]`,
      `${indent}${indent}${indent}${indent}${indent}if arg:`,
      `${indent}${indent}${indent}${indent}${indent}${indent}actual_info[key] = getattr(self, method_name)(cid=arg)`,
      `${indent}${indent}${indent}${indent}${indent}else:`,
      `${indent}${indent}${indent}${indent}${indent}${indent}actual_info[key] = getattr(self, method_name)()`,
      `${indent}${indent}self.dict_diff(dict(actual_info), dict(expectedInfo), compareConfig=diffConfig)`,
    );
  } else {
    context.testClass.push(
      `${indent}def assertComponentInfo(`,
      `${indent}${indent}self,`,
      `${indent}${indent}expectedInfo: Partial${capitalize(componentName)}ComponentInfo,`,
      `${indent}${indent}diffConfig: DiffConfig | None = None,`,
      `${indent}) -> None:`,
      `${indent}${indent}methods_record = self.methodsRecord()`,
      `${indent}${indent}actual_info :dict = {}`,
      `${indent}${indent}for key in expectedInfo:`,
      `${indent}${indent}${indent}if key in methods_record:`,
      `${indent}${indent}${indent}${indent}method_name, arg = methods_record[key]`,
      `${indent}${indent}${indent}${indent}if arg:`,
      `${indent}${indent}${indent}${indent}${indent}actual_info[key] = getattr(self, method_name)(cid=arg)`,
      `${indent}${indent}${indent}${indent}else:`,
      `${indent}${indent}${indent}${indent}${indent}actual_info[key] = getattr(self, method_name)()`,
      `${indent}${indent}self.dict_diff(dict(actual_info), dict(expectedInfo), compareConfig=diffConfig)`,
    );
  }

  return Object.values(context).flat().join("\n");
}
