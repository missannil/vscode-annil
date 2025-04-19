import { componentManager } from "..";
import { getExternalSubComponentPaths } from "./getExternalSubComponentPaths";
import type { ImportedVariables } from "./getImportValueInfo";
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
  const subComponentPaths = getExternalSubComponentPaths(mainPath, subComponentNames, importedVariables);
  const subComponentInfos: SubComponentInfos = {};
  Object.entries(subComponentPaths).forEach(([subComponentName, subComponentPath]) => {
    registerRelatedFile(mainPath, subComponentPath);
    const { importedTypes, customComponentInfos, chunkComponentInfos } = traverseAst(subComponentPath, fileInfo);
    subComponentInfos[subComponentName] = {
      chunkComponentInfos,
      customComponentInfos,
      importedTypes,
      subComponentPath,
    };
  });

  return subComponentInfos;
}
