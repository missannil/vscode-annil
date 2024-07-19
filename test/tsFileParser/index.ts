import path = require("path");
import * as vscode from "vscode";

import type { TsFileInfo } from "../../src/componentManager/tsFileManager";
import { debounce } from "../../src/utils/debounce";
import { isDeepEqual } from "../../src/utils/isDeepEqual";
const demoFsPath = path.resolve(__dirname, "./demo.ts");
const expectedFsPath = path.resolve(__dirname, "./expected.js");
const tsFileManagerFspath = path.resolve(__dirname, "../../out/componentManager/tsFileManager.js");

function startTest(): void {
  vscode.workspace.openTextDocument(demoFsPath).then(async (textDocument) => {
    // console.log("测试开始", expectedResult.rootComponentInfo.dataList);
    const expectedResult: TsFileInfo = (await import(expectedFsPath)).expectedResult;

    const { tsFileParser } = await import(tsFileManagerFspath);
    // @ts-ignore 清除模块缓存
    delete require.cache[expectedFsPath];
    // @ts-ignore
    delete require.cache[tsFileManagerFspath];
    const tsFileInfo: TsFileInfo = tsFileParser(textDocument.getText());
    // console.log("expectedResult", expectedResult,111,tsFileInfo);
    if (isDeepEqual(tsFileInfo, expectedResult)) {
      console.log("\x1b[32m%s\x1b[0m", "测试通过:tsFileParser");
    } else {
      console.error(
        "tsFileParser测试失败",
        "预期:",
        JSON.stringify(expectedResult, null, 2),
        `实际:${JSON.stringify(tsFileInfo, null, 2)}`,
      );
    }
  }, console.error);
}
let enableWatch = true;

export async function tsFileParserTest(): Promise<void> {
  // 启动初始化测试
  startTest();
  // 监控文件变化,重新测试
  if (enableWatch) {
    enableWatch = false;
    const debounceStartTest = debounce(startTest, 500);
    const watcher = vscode.workspace.createFileSystemWatcher(
      `{${demoFsPath},${expectedFsPath},${tsFileManagerFspath}}`,
    );
    watcher.onDidChange((uri) => {
      const changedFsPath = uri.fsPath;
      if (changedFsPath === demoFsPath || changedFsPath === tsFileManagerFspath || changedFsPath === expectedFsPath) {
        debounceStartTest();
      }
    });
  }
}
