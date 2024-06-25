import type { Element } from "domhandler";
import * as vscode from "vscode";
import type { RootComponentInfo } from "../../../componentManager/tsFileManager";
import type { BlockTagInfoList } from "..";
import { BlockTagChecker } from "./checkBlockTag";

export type NativeTagReturnType = { blockTagInfoList: BlockTagInfoList; diagnosticList: vscode.Diagnostic[] };

export function checkNativeTag(
  element: Element,
  wxmlTextlines: string[],
  startLine: number,
  blockTagInfoList: BlockTagInfoList,
  rootComponentInfo: RootComponentInfo,
): NativeTagReturnType {
  const diagnosticList: vscode.Diagnostic[] = [];
  if (element.tagName === "block") {
    const blockTagChecker = new BlockTagChecker(
      element,
      startLine,
      wxmlTextlines,
      blockTagInfoList,
      rootComponentInfo,
    );
    const result = blockTagChecker.check();
    blockTagInfoList = result.blockTagInfoList;
    diagnosticList.push(...result.diagnosticList);
  }

  return { blockTagInfoList, diagnosticList };
}
