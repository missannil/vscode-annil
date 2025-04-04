/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ImportTypeInfo } from "./types";

export function getImportTypeInfo(path: any): ImportTypeInfo {
  const importTypeInfo: ImportTypeInfo = {};
  if (path.node.importKind === "type") {
    path.node.specifiers.forEach((specifier: { local: { name: string | number } }) => {
      importTypeInfo[specifier.local.name] = path.node.source.value;
    });
  } else {
    // 对于非整体类型导入，检查每个 specifier 是否为类型导入
    path.node.specifiers.forEach(
      (specifier: { type: string; importKind: string; local: { name: string | number } }) => {
        if (specifier.type === "ImportSpecifier" && specifier.importKind === "type") {
          importTypeInfo[specifier.local.name] = path.node.source.value;
        }
      },
    );
  }

  return importTypeInfo;
}
