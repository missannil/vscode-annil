import path from "path";
import { miniprogramConfig } from "../../miniprogramConfig";
import { assertNonNullable } from "../../utils/assertNonNullable";
import type { ImportedTypes } from "./getImportTypeInfo";
import { resolveImportPath } from "./resolveImportUri";
import type { CustomComponentInfos, ImportedSubComponentInfo } from "./types";

export function generateImportedComponentInfo(
  mainFspath: string,
  importedTypes: ImportedTypes,
  customComponentInfos: CustomComponentInfos,
): ImportedSubComponentInfo {
  const importedSubCompInfo: ImportedSubComponentInfo = {};
  Object.entries(customComponentInfos).forEach(([customComonentName, customComponentInfo]) => {
    // 有可能自定义组件的类型不是外部导入的,当前文件建立的。
    const typePath = importedTypes[assertNonNullable(customComponentInfo)["componentTypeName"]] as string | undefined;
    if (typePath !== undefined) {
      const tsConfigInfo = miniprogramConfig.getTsConfigInfo(mainFspath);
      const fspath = resolveImportPath(mainFspath, tsConfigInfo, typePath);
      const miniprogramRoot = miniprogramConfig.getProjectConfig(mainFspath).miniprogramRoot;
      // 去除fspath路径中的 miniprogramRoot之前的路径
      const relativePath = fspath.split(miniprogramRoot)[1];
      // 去除文件扩展名
      const parsedPath = path.parse(relativePath);
      const pathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
      // 在前面加上 /
      importedSubCompInfo[customComonentName] = "/" + pathWithoutExtension;
    }
  });

  return importedSubCompInfo;
}
