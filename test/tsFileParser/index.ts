import path = require("path");
import * as vscode from "vscode";
import type { TsFileInfo } from "../../src/componentManager/tsFileManager";
import { debounce } from "../../src/utils/debounce";
import { isDeepEqual } from "../../src/utils/isDeepEqual";
const demoFsPath = path.resolve(__dirname, "./demo.ts");
const expectedFsPath = path.resolve(__dirname, "./expected.js");
const tsFileManagerFspath = path.resolve(__dirname, "../../out/componentManager/tsFileManager.js");

async function start(): Promise<void> {
  // @ts-expect-error 由于缓存机制,在修改expected.js时,需要修改两次才能让第一次的修改生效。
  delete require.cache[expectedFsPath];
  const textDocument = await vscode.workspace.openTextDocument(demoFsPath);
  // console.log("测试开始", expectedResult.rootComponentInfo.dataList);
  const expectedResult: TsFileInfo = (await import(expectedFsPath)).expectedResult;
  const { tsFileParser } = await import(tsFileManagerFspath);
  const tsFileInfo: TsFileInfo = tsFileParser(textDocument.getText());
  // console.log("expectedResult", expectedResult,111,tsFileInfo);
  if (isDeepEqual(tsFileInfo, expectedResult)) {
    console.log("\x1b[32m%s\x1b[0m", "测试通过:tsFileParser");
  } else {
    console.error("tsFileParser测试失败");
  }
}
const debounceStartTest = debounce(start, 500);
// 启动初始化测试
start().then(() => {
  // 监控文件变化,重新测试
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.contentChanges.length === 0) return;
      const textDocument = event.document;
      const uri = textDocument.uri;
      const changedFsPath = uri.fsPath;
      if (changedFsPath === demoFsPath || changedFsPath === tsFileManagerFspath || changedFsPath === expectedFsPath) {
        debounceStartTest();
      }
    },
  );
}, console.error);
