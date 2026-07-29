import { vscode } from "#deps";
import type { JsonFileInfo } from "../types/JsonFileInfo.js";
import { checkPlaceholder } from "./checkPlaceholder.js";
import { validateInvalidPath } from "./validateInvalidPath.js";
import { validateMissingImports } from "./validateMissingImports.js";
import { validateUnknownImports } from "./validateUnknownImports.js";
import { validateUnknownKeys } from "./validateUnknownKeys.js";

/**
 * JSON 文件校验器
 *
 * 校验 JSON 配置文件的合法性：
 * 1. 未知配置属性（拼写错误等）
 * 2. 缺少的组件导入（TS 中引用但 JSON 未声明）
 * 3. 未知的组件导入（JSON 声明但 TS 未引用）
 * 4. 无效的导入路径（路径与 TS 推导不一致）
 * 5. componentPlaceholder 占位组件校验
 *
 * @param jsonFileInfo - JSON 文件解析结果
 * @param importedSubCompInfo - TS 推导的导入子组件映射（组件名 → 路径）
 */
export function validateJson(
  jsonFileInfo: JsonFileInfo,
  importedSubCompInfo: Record<string, string | undefined>,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const config = jsonFileInfo.config;
  const textlines = jsonFileInfo.text.split(/\r?\n/);

  // 1. 未知配置属性
  diagnosticList.push(...validateUnknownKeys(config, textlines));

  // 2. 缺少的组件导入
  const usingComponents = config.usingComponents ?? {};
  const usingComponentsKeys = Object.keys(usingComponents);
  diagnosticList.push(...validateMissingImports(usingComponentsKeys, importedSubCompInfo, textlines));

  // 3. 未知的组件导入（同时返回合法 import key 列表）
  const unknownResult = validateUnknownImports(usingComponentsKeys, importedSubCompInfo, textlines);
  diagnosticList.push(...unknownResult.diagnosticList);

  // 4. 无效的导入路径
  diagnosticList.push(
    ...validateInvalidPath(usingComponents, importedSubCompInfo, unknownResult.validImportKeys, textlines),
  );

  // 5. componentPlaceholder 校验
  const componentPlaceholder = config.componentPlaceholder ?? {};
  // 未知 usingComponents 项已经有专属诊断，不应再级联为“缺少占位组件”。
  diagnosticList.push(...checkPlaceholder(componentPlaceholder, unknownResult.validImportKeys, textlines));

  return diagnosticList;
}
