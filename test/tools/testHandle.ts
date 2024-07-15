import * as path from "path";
import * as vscode from "vscode";
import { getSiblingUri } from "../../out/componentManager/getSiblingUri";
import { wxmlFileManager } from "../../out/componentManager/wxmlFileManager";
import { diagnosticFixProvider } from "../../out/diagnosticFixProvider";
import { assertNonNullable } from "../../out/utils/assertNonNullable";
import { wxmlChecker } from "../../out/wxmlChecker";
import type { ComponentUri, WxmlUri } from "../../src/componentManager/isComponentUri";
import { findDiffItems } from "./findDiffItems";
let checkCountOfExample = 0;
let completedCountOfExample = 0;

function completeHandle(): void {
  completedCountOfExample--;
  // console.log("完成用例数量:", completedCountOfExample);
  if (completedCountOfExample === 0) {
    console.log("测试用例数量:", checkCountOfExample);
  }
}

export async function replaceFileContent(uri: vscode.Uri, newContent: string): Promise<boolean> {
  const document = await vscode.workspace.openTextDocument(uri);
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  );
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, fullRange, newContent);

  return vscode.workspace.applyEdit(edit);
}

function getTestFileFsPath(wxmlUri: vscode.Uri): string {
  return wxmlUri.fsPath.split(`test${path.sep}`)[1];
}

async function fixAllActionTest(
  wxmlUri: WxmlUri,
  testContent: string,
  fixAllAction: vscode.CodeAction,
  expectAfterFixedErrorMessageList: string[],
): Promise<void> {
  // console.log("测试修复功能",index);
  const testFilePath = getTestFileFsPath(wxmlUri);
  // console.log("注册修复功能回调",index);

  wxmlChecker.registerCheckCompletedCallback(wxmlUri.fsPath, async (diagnosticList) => {
    // console.log("修复后诊断",  diagnosticList);
    // console.log("删除修复功能回调",  testFilePath);
    wxmlChecker.deregisterCheckCompletedCallback(wxmlUri.fsPath);
    const diffErrorMessage = findDiffItems(
      diagnosticList.map((diagnostic) => diagnostic.message),
      expectAfterFixedErrorMessageList,
    );
    if (diffErrorMessage.length === 0) {
      console.log("\x1b[32m%s\x1b[0m", `${testFilePath}`);
    } else {
      console.error(wxmlUri.fsPath, "修复后还有错误", diagnosticList.map((diagnostic) => diagnostic.message).join());
    }
    await replaceFileContent(wxmlUri, testContent);
    // console.log("恢复原始测试状态", testFilePath);
    // console.log("测试修复功能完成");
    completeHandle();
  });

  // 执行修复命令后,还会触发诊断检查。
  // console.log("执行修复", testFilePath);

  void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
}

export async function test(
  compUri: ComponentUri,
  // 预期的错误信息列表
  expectErrorMessageList: string[],
  // undefined表示忽略验证修复功能,[]表示预期修复后没有错误,有值表示预期修复后的错误信息
  expectAfterFixedErrorMessageList?: string[],
): Promise<void> {
  checkCountOfExample++;
  completedCountOfExample++;
  const wxmlUri = getSiblingUri(compUri, ".wxml");
  const testFilePath = getTestFileFsPath(wxmlUri);
  // console.log("错误信息测试", testFilePath);
  const testContent = (await wxmlFileManager.get(wxmlUri.fsPath)).text;
  // 注册检测完成后的回调
  // console.log("注册检测完成回调", index);
  wxmlChecker.registerCheckCompletedCallback(wxmlUri.fsPath, async (diagnosticList) => {
    wxmlChecker.deregisterCheckCompletedCallback(wxmlUri.fsPath);
    // console.log("检测完成回调", diagnosticList);
    const diffErrorMessage = findDiffItems(
      diagnosticList.map((diagnostic) => diagnostic.message),
      expectErrorMessageList,
    );
    // console.log("错误信息:", errorMessage);
    if (diffErrorMessage.length > 0) {
      console.error(`测试错误不符合预期: ${testFilePath}`, diffErrorMessage.join());
      completeHandle();

      return;
    } else {
      // 如果预期修复后错误信息为undefined,通过测试,不需要验证修复功能
      if (!expectAfterFixedErrorMessageList) {
        // console.log("没有修复内容");
        console.log("\x1b[32m%s\x1b[0m", `${testFilePath}`);
        completeHandle();

        return;
      }
      // console.log("错误信息测试通过");
    }
    const fixAllAction = diagnosticFixProvider.generateFixAllAction(wxmlUri, diagnosticList);
    if (assertNonNullable(fixAllAction.edit).size === 0) {
      console.error("无法修复,但是预期有修复后错误信息", testFilePath);
      completeHandle();
    } else {
      await fixAllActionTest(wxmlUri, testContent, fixAllAction, expectAfterFixedErrorMessageList);
    }
  });
  // 打开文件
  // console.log("打开测试文件", compUri.fsPath);

  await vscode.workspace.openTextDocument(compUri);
}
