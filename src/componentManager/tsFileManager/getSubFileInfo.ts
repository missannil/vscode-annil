/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs";
import type { TsUri } from "../uriHelper";
import { getChunkComponentInfo } from "./getChunkComponentInfo";
import { getImportTypeInfo } from "./getImportTypeInfo";
import { getCustomComponentInfo } from "./getSubComponentInfo";
import type { SubFileInfo } from "./types";

/**
 * 同步获取子组件信息
 */
export function getSubFileInfo(
  compName: string,
  uriOrText: TsUri | string,
): SubFileInfo | null {
  const subFileInfo: SubFileInfo = {
    componentInfo: null,
    importTypeInfo: {},
  };
  const isUri = typeof uriOrText !== "string";
  let tsText: string;
  if (!isUri) {
    tsText = uriOrText;
  } else {
    try {
      // 使用 fs 模块同步读取文件内容
      tsText = fs.readFileSync(uriOrText.fsPath, "utf-8");
    } catch (error) {
      // console.error(`读取文件出错: ${uriOrText}`, error);

      return null;
    }
  }
  const tsFileAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });
  traverse(tsFileAST, {
    ImportDeclaration(path) {
      Object.assign(subFileInfo.importTypeInfo, getImportTypeInfo(path));
    },
    VariableDeclarator(variableDeclarator: any) {
      const customComponentInfo = getCustomComponentInfo(variableDeclarator, [compName]);
      // console.log("hry 获取自定义组件信息", customComponentInfo, variableDeclarator.node.id.name, variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName?.name);
      if (customComponentInfo) {
        subFileInfo.componentInfo = {
          type: "custom",
          componentTypeName: variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName?.name,
          info: customComponentInfo,
        };
        // 第一次获取到组件信息时是通过uri获取的,所以这里会记录uri和行号,后续修改时传入的是text,不会进入这个分支
        if (isUri) {
          subFileInfo.componentInfo.uri = uriOrText;
          subFileInfo.componentInfo.line = variableDeclarator.node.loc?.start.line;
        }

        return;
      }
      const chunkComponentInfo = getChunkComponentInfo(variableDeclarator, [compName]);
      // console.log("hry 获取chunk组件信息", chunkComponentInfo, variableDeclarator.node.id.name)

      if (chunkComponentInfo) {
        subFileInfo.componentInfo = {
          type: "chunk",
          info: chunkComponentInfo,
        };
        // 第一次获取到组件信息时是通过uri获取的,所以这里会记录uri和行号,后续修改时传入的是text,不会进入这个分支
        if (isUri) {
          subFileInfo.componentInfo.uri = uriOrText;
          subFileInfo.componentInfo.line = variableDeclarator.node.loc?.start.line;
        }
      }
    },
  });

  return subFileInfo;
}
