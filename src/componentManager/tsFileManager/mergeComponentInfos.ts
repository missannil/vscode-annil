import { generateSubImportedComponentPaths } from "./generateImportedComponentInfo";
import { generateMainImportedComponentPath } from "./generateMainImportedComponentPath";
import type { SubComponentInfos } from "./getExternalSubComponentInfos";
import type { TraverseAstResult } from "./traverseAst";
import type { ComponentInfo, ImportedSubComponentPaths } from "./types";

export function mergeComponentInfos(
  mainFspath: string,
  mainComponentInfo: TraverseAstResult,
  subComponentInfos: SubComponentInfos,
): ComponentInfo {
  const { rootComponentInfo, customComponentInfos, chunkComponentInfos, importedTypes } = mainComponentInfo;
  // 子组件导入信息,这里搜集主文件中的导入信息
  const importedSubComponentPaths: ImportedSubComponentPaths = generateMainImportedComponentPath(
    mainFspath,
    importedTypes,
    customComponentInfos,
  );

  Object.entries(subComponentInfos).forEach(([subComponentName, subComponentInfo]) => {
    const {
      chunkComponentInfos: subChunkComponentInfos,
      customComponentInfos: subCustomComponentInfos,
      importedTypes: subImportedTypes,
      subComponentPath,
    } = subComponentInfo;
    Object.assign(customComponentInfos, subCustomComponentInfos);
    Object.assign(chunkComponentInfos, subChunkComponentInfos);
    // 这里搜集子文件中的导入信息
    const subComponentImportedPaths = generateSubImportedComponentPaths(
      mainFspath,
      subComponentPath,
      subImportedTypes,
      subCustomComponentInfos,
    );
    const subComponentImportedPath = subComponentImportedPaths[subComponentName] as string | undefined;
    if (subComponentImportedPath !== undefined) {
      importedSubComponentPaths[subComponentName] = subComponentImportedPath;
    }
  });

  return {
    rootComponentInfo,
    customComponentInfos,
    chunkComponentInfos,
    importedSubCompInfo: importedSubComponentPaths,
  };
}
