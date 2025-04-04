import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs";
import type { TsUri } from "../uriHelper";
import { getImportTypeInfo } from "./getImportTypeInfo";
import { getSubComponentInfo } from "./getSubComponentInfo";
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
  let tsText: string;
  if (typeof uriOrText === "string") {
    tsText = uriOrText;
  } else {
    try {
      // 使用 fs 模块同步读取文件内容
      tsText = fs.readFileSync(uriOrText.fsPath, "utf-8");
    } catch (error) {
      console.error(`读取文件出错: ${uriOrText}`, error);

      return null;
    }
  }
  const tsFileAST = parse(tsText, { sourceType: "module", plugins: ["typescript"] });
  traverse(tsFileAST, {
    ImportDeclaration(path) {
      Object.assign(subFileInfo.importTypeInfo, getImportTypeInfo(path));
    },
    VariableDeclarator(path) {
      subFileInfo.componentInfo = getSubComponentInfo(path, [compName]);
    },
  });

  return subFileInfo;
}
