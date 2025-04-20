import path from "path";
import { miniprogramConfig } from "../../miniprogramConfig";
import { assertNonNullable } from "../../utils/assertNonNullable";
import type { ImportedTypes } from "./getImportTypeInfo";
import { isRelativePath, resolveAliasPathsPath } from "./resolveImportUri";
import type { CustomComponentInfos, ImportedSubComponentPaths } from "./types";

export function generateSubImportedComponentPaths(
  mainFspath: string,
  subComponentPath: string,
  importedTypes: ImportedTypes,
  customComponentInfos: CustomComponentInfos,
): ImportedSubComponentPaths {
  const importedSubCompInfo: ImportedSubComponentPaths = {};
  Object.entries(customComponentInfos).forEach(([customComonentName, customComponentInfo]) => {
    const typePath = importedTypes[assertNonNullable(customComponentInfo)["componentTypeName"]] as string | undefined;
    // 有可能自定义组件的类型不是外部导入的,当前文件建立的,那么typePath就是undefined
    if (typePath === undefined) return;
    if (isRelativePath(subComponentPath) && isRelativePath(typePath)) {
      const compositionPath = path.join(path.dirname(subComponentPath), typePath);
      importedSubCompInfo[customComonentName] = isRelativePath(compositionPath)
        ? compositionPath
        : "./" + compositionPath;

      return;
    }
    const tsConfigInfo = miniprogramConfig.getTsConfigInfo(mainFspath);
    const filepath = isRelativePath(typePath)
      ? path.resolve(path.dirname(subComponentPath), typePath) + ".ts"
      : resolveAliasPathsPath(tsConfigInfo, typePath);
    const miniprogramRoot = miniprogramConfig.getProjectConfig(mainFspath).miniprogramRoot;
    // 去除fspath路径中的 miniprogramRoot之前的路径
    const relativePath = filepath.split(miniprogramRoot)[1];
    // 去除文件扩展名
    const parsedPath = path.parse(relativePath);
    const pathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
    // 在前面加上 /
    importedSubCompInfo[customComonentName] = "/" + pathWithoutExtension;
  });

  return importedSubCompInfo;
}
