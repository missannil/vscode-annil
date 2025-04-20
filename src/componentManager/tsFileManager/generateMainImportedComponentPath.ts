import path from "path";
import { miniprogramConfig } from "../../miniprogramConfig";
import { assertNonNullable } from "../../utils/assertNonNullable";
import type { ImportedTypes } from "./getImportTypeInfo";

import { isRelativePath, resolveAliasPathsPath } from "./resolveImportUri";
import type { CustomComponentInfos, ImportedSubComponentPaths } from "./types";

// 获取主文件中导入的子组件路径,（根据组件类型路径获取组件路径,把ts变量路径转化为json中可以使用的路径）
export function generateMainImportedComponentPath(
  mainFspath: string,
  importedTypes: ImportedTypes,
  customComponentInfos: CustomComponentInfos,
): ImportedSubComponentPaths {
  const importedSubCompInfo: ImportedSubComponentPaths = {};
  Object.entries(customComponentInfos).forEach(([customComonentName, customComponentInfo]) => {
    const typePath = importedTypes[assertNonNullable(customComponentInfo)["componentTypeName"]] as string | undefined;
    // 有可能自定义组件的类型不是外部导入的,当前文件建立的,那么typePath就是undefined
    if (typePath === undefined) return;
    if (isRelativePath(typePath)) {
      importedSubCompInfo[customComonentName] = typePath;

      return;
    }
    // 非相对路径,截取路径,因为小程序josn文件中不支持变量路径,但支持以/开头的路径,表示小程序根目录下的路径
    const tsConfigInfo = miniprogramConfig.getTsConfigInfo(mainFspath);
    const absolutePath = resolveAliasPathsPath(tsConfigInfo, typePath);
    // 获取小程序根目录
    const miniprogramRoot = miniprogramConfig.getProjectConfig(mainFspath).miniprogramRoot;
    // 去除路径中的 miniprogramRoot之前的路径
    const relativePath = absolutePath.split(miniprogramRoot)[1];
    // 去除文件扩展名
    const parsedPath = path.parse(relativePath);
    const pathWithoutExtension = path.join(parsedPath.dir, parsedPath.name);
    // 在前面加上 `/`
    importedSubCompInfo[customComonentName] = "/" + pathWithoutExtension;
  });

  return importedSubCompInfo;
}
