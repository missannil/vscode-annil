/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { Identifier } from "@babel/types";
import { fs } from "../../publicModule";
import { generateCustomCompConfigInfo } from "./generateCustomCompInfo";
import { generateRootComponentInfo } from "./generateRootCompInfo";
import { getImportTypeInfo, type ImportedTypes } from "./getImportTypeInfo";
import { getImportedVariables, type ImportedVariables } from "./getImportValueInfo";
import type { ChunkComponentInfos, CustomComponentInfos, FileInfo, RootComponentInfo } from "./types";

export type TraverseAstResult = {
  // DefineComponent函数中的subComponents字段(数组)中的所有item的名称
  subComponentNames: string[];
  // tsFile中导入的变量名和路径
  importedVariables: ImportedVariables;
  importedTypes: ImportedTypes;
  // CustomComponent函数中的components字段(数组)中的所有item的名称
  customComponentInfos: CustomComponentInfos;
  chunkComponentInfos: ChunkComponentInfos;
  rootComponentInfo: RootComponentInfo;
};

// ast中导入值的变量名和路径 例如: import { a } from "./path/to" 变量名是a, 路径是"./path/to"

export function traverseAst(absolutePath: string, existingFileInfo: FileInfo): TraverseAstResult {
  // 如果传入的文件路径和当前路径相同,则直接使用传入的文件内容,否则自己读取文件内容
  const tsText = existingFileInfo[0] === absolutePath ? existingFileInfo[1] : fs.readFileSync(absolutePath, "utf-8");
  const tsAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });
  const subComponentNames: string[] = [];
  const importedVariables: ImportedVariables = {};
  const importedTypes: ImportedTypes = {};
  const customComponentInfos: TraverseAstResult["customComponentInfos"] = {};
  const chunkComponentInfos: TraverseAstResult["chunkComponentInfos"] = {};
  const rootComponentInfo: TraverseAstResult["rootComponentInfo"] = {
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: [],
    events: [],
    customEvents: [],
  };
  traverse(tsAST, {
    CallExpression(nodePath) {
      const expression = nodePath.node.callee as any;
      if (expression?.type !== "Identifier") return;
      const funcName = expression.name;
      if (funcName === "DefineComponent") {
        // 提取所有SubComponent函数中的数据和事件
        const subComponents = (nodePath.node.arguments[0] as any)?.properties?.find(
          (property: any) => property.key.name === "subComponents",
        )?.value?.elements;
        if (subComponents !== undefined) {
          subComponentNames.push(...subComponents.map((element: Identifier) => (element as Identifier).name));
        }

        return;
      }
    },
    // 从import字段中获取外部组件文件路径
    ImportDeclaration(nodePath) {
      Object.assign(importedVariables, getImportedVariables(nodePath));
      Object.assign(importedTypes, getImportTypeInfo(nodePath));
    },
    VariableDeclarator(variableDeclarator: any) {
      const node = variableDeclarator.node as any;
      const nodeInit = node.init;
      if (nodeInit?.type !== "CallExpression") return null;
      if (nodeInit.callee.type !== "CallExpression") return null;
      if (nodeInit.callee.callee.type !== "Identifier") return null; // 排除非想要的函数调用
      const funcName = nodeInit.callee.callee.name;
      if (funcName === "CustomComponent") {
        const variableName = variableDeclarator.node.id.name;
        const typeName = variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName
          ?.name;
        const customComponentConfigInfo = generateCustomCompConfigInfo(nodeInit);
        customComponentInfos[variableName] = {
          line: variableDeclarator.node.loc?.start.line,
          componentTypeName: typeName,
          fsPath: absolutePath,
          configInfo: customComponentConfigInfo,
        };

        return;
      }
      if (funcName === "ChunkComponent") {
        // chunk组件定义和RootComponent定义基本一样,所以使用了generateRootComponentInfo函数
        const chunkComponentInfo = generateRootComponentInfo(nodeInit);
        Reflect.deleteProperty(chunkComponentInfo, "customEvents");
        const variableName = variableDeclarator.node.id.name;
        chunkComponentInfos[variableName] = {
          fsPath: absolutePath,
          line: variableDeclarator.node.loc?.start.line,
          configInfo: chunkComponentInfo,
        };
      }
      if (funcName === "RootComponent") {
        Object.assign(rootComponentInfo, generateRootComponentInfo(nodeInit));
      }
    },
  });

  return {
    subComponentNames,
    importedVariables,
    importedTypes,
    customComponentInfos,
    chunkComponentInfos,
    rootComponentInfo,
  };
}
