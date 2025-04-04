import path = require("path");
import * as vscode from "vscode";
import { tsFileManager } from "../../out/componentManager/tsFileManager/index";
import type {
  ChunkComponentInfos,
  CustomComponentInfos,
  ImportTypeInfo,
  RootComponentInfo,
} from "../../out/componentManager/tsFileManager/types";
import type { TsUri } from "../../out/componentManager/uriHelper";
import { debounce } from "../../out/utils/debounce";
import { isDeepEqual } from "../../out/utils/isDeepEqual";
const demoCompFsPath = path.resolve(__dirname, "./demoComp/demoComp.ts");
const expectedFsPath = path.resolve(__dirname, "./expectedTsFileInfo.js");

const debounceStartTest = debounce(tsFileParserTest, 300);
// 监控文件变化并重新测试,当前文件的js文件,expected.js和demoCompFsPath
vscode.workspace.onDidChangeTextDocument(
  (event) => {
    if (event.contentChanges.length === 0) return;
    const textDocument = event.document;
    const changedFsPath = textDocument.uri.fsPath;
    // console.log("文件变化");
    if (changedFsPath === __filename || changedFsPath === expectedFsPath || changedFsPath === demoCompFsPath) {
      debounceStartTest();
    }
  },
);

export async function tsFileParserTest(): Promise<void> {
  // console.log("tsFileParser测试开始");
  // @ts-expect-error 由于缓存机制,在修改expected.js时,需要修改两次才能让第一次的修改生效。
  delete require.cache[expectedFsPath];
  // 打开文件
  await vscode.workspace.openTextDocument(expectedFsPath);
  await vscode.workspace.openTextDocument(__filename);
  const textDocument = await vscode.workspace.openTextDocument(demoCompFsPath);
  // 获取生成的TsFileInfo
  const currentTsFileInfo = await tsFileManager.get(textDocument.uri as TsUri);
  const expectedTsFileInfo = (await import("./expectedTsFileInfo.js")).expectedTsFileInfo;
  if (isDeepEqual(currentTsFileInfo, expectedTsFileInfo)) {
    console.log("\x1b[32m%s\x1b[0m", "测试通过:tsFileParser");
  } else {
    Object.keys(currentTsFileInfo).forEach((key) => {
      const currentVal = currentTsFileInfo[key as keyof typeof currentTsFileInfo];
      const expectedVal = expectedTsFileInfo[key as keyof typeof expectedTsFileInfo];
      if (!isDeepEqual(currentVal, expectedVal)) {
        console.error(
          "测试失败",
          key,
          findDiffItem(currentVal, expectedVal),
        );
      }
    });
  }
}

// 找到不同的属性并返回
function findDiffItem(
  currentVal: CustomComponentInfos | RootComponentInfo | ImportTypeInfo | ChunkComponentInfos,
  expectedVal: CustomComponentInfos | RootComponentInfo | ImportTypeInfo | ChunkComponentInfos,
): unknown[][] {
  const diffList: unknown[][] = [];
  Object.keys(currentVal).forEach((key) => {
    const currentValItem = currentVal[key as keyof typeof currentVal];
    const expectedValItem = expectedVal[key as keyof typeof expectedVal];
    if (!isDeepEqual(currentValItem, expectedValItem)) {
      diffList.push([currentValItem, expectedValItem]);
    }
  });

  return diffList;
}
