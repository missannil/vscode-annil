import traverse from "@babel/traverse";
import type { Identifier, Node } from "@babel/types";

// 获取导入组件文件的路径
export function getExternalComponentFilePaths(
  localTsFileAST: Node,
  subComponentNames: string[],
): Record<string, string> {
  const paths: Record<string, string> = {};
  traverse(localTsFileAST, {
    // 从import字段中获取外部组件文件路径
    ImportDeclaration(path) {
      const importKind = path.node.importKind;
      // 如果导入的是变量名且是自定义组件
      if (importKind === "value") {
        for (const specifier of path.node.specifiers) {
          if (specifier.type === "ImportSpecifier" && specifier.importKind === "value") {
            const importedName = (specifier.imported as Identifier).name;
            if (subComponentNames.includes(importedName)) {
              paths[importedName] = path.node.source.value;
            }
          }
        }
      }
    },
  });

  return paths;
}
