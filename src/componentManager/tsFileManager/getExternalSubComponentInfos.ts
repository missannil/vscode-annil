import path from "path";
import { miniprogramConfig } from "../../miniprogramConfig";
import { componentManager } from "..";
import { getExternalSubComponentPaths } from "./getExternalSubComponentPaths";
import type { ImportedVariables } from "./getImportValueInfo";
import { isRelativePath, resolveAliasPathsPath } from "./resolveImportUri";
import { traverseAst, type TraverseAstResult } from "./traverseAst";
import type { FileInfo } from "./types";

export type SubComponentInfos = Record<string, {
  subComponentPath: string;
  chunkComponentInfos: TraverseAstResult["chunkComponentInfos"];
  customComponentInfos: TraverseAstResult["customComponentInfos"];
  importedTypes: TraverseAstResult["importedTypes"];
}>;

// 注册关联文件
function registerRelatedFile(mainPath: string, subComponentPath: string): void {
  const isRelatedPath = componentManager.isRelatedPath(subComponentPath);
  if (!isRelatedPath) {
    componentManager.regesiterRelateFile(subComponentPath, mainPath);
  }
}

export function getSubComponentInfos(
  mainPath: string,
  subComponentNames: string[],
  importedVariables: ImportedVariables,
  fileInfo: FileInfo,
): SubComponentInfos {
  const subComponentPaths = getExternalSubComponentPaths(subComponentNames, importedVariables);
  const subComponentInfos: SubComponentInfos = {};
  Object.entries(subComponentPaths).forEach(([subComponentName, subComponentPath]) => {
    const absolutePath = isRelativePath(subComponentPath)
      ? path.resolve(path.dirname(mainPath), subComponentPath + ".ts")
      : resolveAliasPathsPath(miniprogramConfig.getTsConfigInfo(mainPath), subComponentPath);
    registerRelatedFile(mainPath, absolutePath);
    const { importedTypes, customComponentInfos, chunkComponentInfos } = traverseAst(absolutePath, fileInfo);
    subComponentInfos[subComponentName] = {
      chunkComponentInfos,
      customComponentInfos,
      importedTypes,
      // 保留相对路径
      subComponentPath: isRelativePath(subComponentPath) ? subComponentPath : absolutePath,
    };
  });

  return subComponentInfos;
}
