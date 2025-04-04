import type { TsUri } from "../uriHelper";
import { getAppJsonResolveAlias } from "./getAppJsonResolveAlias";
import { parseAlias } from "./parseAlias";
import type { CustomComponentMap, ImportTypeInfo } from "./types";

// * 解析导入的子组件信息,返回导入的子组件信息(真实的组件名和路径)
export function parseImportedInfo(
  nameMap: CustomComponentMap,
  importInfo: ImportTypeInfo,
  tsUri: TsUri,
): ImportTypeInfo {
  const importedSubCompInfo: ImportTypeInfo = {};
  const resolveAlias = getAppJsonResolveAlias(tsUri);
  for (const compName in nameMap) {
    const compTypeName = nameMap[compName];
    // 如果没有找到对应的导入信息,则跳过
    if (importInfo[compTypeName] === undefined) continue;
    // importName 可能有前缀$,去掉前缀并首字母小写,作为key
    if (!resolveAlias) {
      // 如果没有resolveAlias或者没有找到对应的importInfo,则跳过 在SubComponent使用了非导入的组件类型(自定义组件类型)的情况下会出现这种情况
      importedSubCompInfo[compName] = importInfo[compTypeName];
    } else {
      importedSubCompInfo[compName] = parseAlias(importInfo[compTypeName], resolveAlias);
    }
  }

  return importedSubCompInfo;
}
