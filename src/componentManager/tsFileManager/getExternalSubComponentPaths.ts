import { miniprogramConfig } from "../../miniprogramConfig";
import type { ImportedVariables } from "./getImportValueInfo";
import { resolveImportPath } from "./resolveImportUri";
type SubComponentName = string;
type SubComponentPath = string;

// 外部导入的子组件信息
export type ExternalSubComponentPaths = Record<SubComponentName, SubComponentPath>;

/**
 * 从导入的变量中获取子组件信息(路径会被解析为绝对路径)
 * @param currentPath 当前文件路径
 * @param subComponentNames  子组件名称列表
 * @param importedVariables  导入的变量列表
 * @returns
 */
export function getExternalSubComponentPaths(
  currentPath: string,
  subComponentNames: string[],
  importedVariables: ImportedVariables,
): ExternalSubComponentPaths {
  const tsConfigInfo = miniprogramConfig.getTsConfigInfo(currentPath);
  const externalSubComponentInfos: ExternalSubComponentPaths = {};
  for (const [importedName, importedPath] of Object.entries(importedVariables)) {
    if (subComponentNames.includes(importedName)) {
      externalSubComponentInfos[importedName] = resolveImportPath(currentPath, tsConfigInfo, importedPath);
    }
  }

  return externalSubComponentInfos;
}
