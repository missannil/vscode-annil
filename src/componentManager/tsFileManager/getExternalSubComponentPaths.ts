import type { ImportedVariables } from "./getImportValueInfo";
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
  subComponentNames: string[],
  importedVariables: ImportedVariables,
): ExternalSubComponentPaths {
  const externalSubComponentInfos: ExternalSubComponentPaths = {};
  for (const [importedName, importedPath] of Object.entries(importedVariables)) {
    if (subComponentNames.includes(importedName)) {
      externalSubComponentInfos[importedName] = importedPath;
    }
  }

  return externalSubComponentInfos;
}
