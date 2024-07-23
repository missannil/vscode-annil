import * as path from "path";
import * as vscode from "vscode";
import { getSiblingUri } from "../../out/componentManager/getSiblingUri";
import type { JsonUri } from "../../out/componentManager/isComponentUri";
import { jsonFileManager } from "../../out/componentManager/jsonFileManager";
import { wxmlFileManager } from "../../out/componentManager/wxmlFileManager";
import { diagnosticFixProvider } from "../../out/diagnosticFixProvider";
import { jsonChecker } from "../../out/jsonChecker";
import { assertNonNullable } from "../../out/utils/assertNonNullable";
import { wxmlChecker } from "../../out/wxmlChecker";
import type { ComponentUri, WxmlUri } from "../../src/componentManager/isComponentUri";
import { findDiffItems } from "./findDiffItems";

function completedCount(): void {
  completedCountOfExample++;
  // console.log("完成用例数量:", completedCountOfExample);
  if (completedCountOfExample === checkExampleCount) {
    console.log(`${checkExampleCount}个测试示例全部测试完成`);
  }
  if (completedCountOfExample > checkExampleCount) {
    console.log("测试实例多余预期数量", completedCountOfExample);
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

// 把文件路径截取test目录以后的路径
function getSimplePath(wxmlUri: vscode.Uri): string {
  return wxmlUri.fsPath.split(`test${path.sep}`)[1];
}

async function fixAllActionTest(
  uri: WxmlUri | JsonUri,
  fixAllAction: vscode.CodeAction,
  expectAfterFixedErrorMessageList: string[],
): Promise<void> {
  if (isWxmlFile(uri)) {
    const wxmlFileText = (await wxmlFileManager.get(uri.fsPath)).text;
    const testFilePath = getSimplePath(uri);
    wxmlChecker.registerCheckCompletedCallback(uri.fsPath, async (diagnosticList) => {
      wxmlChecker.deregisterCheckCompletedCallback(uri.fsPath);
      const diffErrorMessage = findDiffItems(
        diagnosticList.map((diagnostic) => diagnostic.message),
        expectAfterFixedErrorMessageList,
      );
      if (diffErrorMessage.length === 0) {
        console.log("\x1b[32m%s\x1b[0m", `${testFilePath}`);
      } else {
        console.error(uri.fsPath, "修复后还有错误", diagnosticList.map((diagnostic) => diagnostic.message).join());
      }
      await replaceFileContent(uri, wxmlFileText);
      completedCount();
    });
  } else {
    const jsonFileText = (await jsonFileManager.get(uri.fsPath)).text;
    // console.log("测试修复功能",index);
    const testFilePath = getSimplePath(uri);
    // console.log("注册修复功能回调",index);

    jsonChecker.registerCheckCompletedCallback(uri, async (diagnosticList) => {
      // console.log("删除修复功能回调", diagnosticList);
      jsonChecker.deregisterCheckCompletedCallback(uri);
      const diffErrorMessage = findDiffItems(
        diagnosticList.map((diagnostic) => diagnostic.message),
        expectAfterFixedErrorMessageList,
      );
      if (diffErrorMessage.length === 0) {
        console.log("\x1b[32m%s\x1b[0m", `${testFilePath}`);
      } else {
        console.error(uri.fsPath, "修复后还有错误", diagnosticList.map((diagnostic) => diagnostic.message).join());
      }
      await replaceFileContent(uri, jsonFileText);
      // console.log("恢复原始测试状态", testFilePath);
      // console.log("测试修复功能完成");
      completedCount();
    });

    // 执行修复命令后,还会触发诊断检查。
    // console.log("执行修复", testFilePath);
  }
  void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
}
// 测试用例数量
const checkExampleCount = 22;
// 完成用例数量
let completedCountOfExample = 0;

type CheckType = "json" | "wxml";

function isWxmlFile(uri: vscode.Uri): uri is WxmlUri {
  return uri.fsPath.endsWith(".wxml");
}

async function checkHanle(
  uri: WxmlUri | JsonUri,
  diagnosticList: vscode.Diagnostic[],
  expectErrorMessageList: string[],
  expectAfterFixedErrorMessageList?: string[],
): Promise<void> {
  // console.log("开始测试");
  const testFileSimplePath = getSimplePath(uri);
  const diffErrorMessage = findDiffItems(
    diagnosticList.map((diagnostic) => diagnostic.message),
    expectErrorMessageList,
  );
  // console.log("错误信息:", diffErrorMessage);
  if (diffErrorMessage.length > 0) {
    console.error(`测试错误不符合预期: ${testFileSimplePath}`, diffErrorMessage.join());
    completedCount();

    return;
  } else if (!expectAfterFixedErrorMessageList) {
    // 如果预期修复后错误信息为undefined,通过测试,不需要验证修复功能

    // console.log("没有修复内容");
    console.log("\x1b[32m%s\x1b[0m", `${testFileSimplePath}`);
    completedCount();

    return;

    // console.log("错误信息测试通过");
  }

  const fixAllAction = isWxmlFile(uri)
    ? diagnosticFixProvider.generateFixAllAction(uri, diagnosticList)
    : diagnosticFixProvider.generateFixAllActionOfJson(
      uri,
      diagnosticList,
      (await wxmlFileManager.get(uri.fsPath)).text,
    );

  if (assertNonNullable(fixAllAction.edit).size === 0) {
    console.error("无法修复,但是预期有修复后错误信息", testFileSimplePath);
    completedCount();
  } else {
    await fixAllActionTest(uri, fixAllAction, expectAfterFixedErrorMessageList);
  }
}

/**
 * 1.  根据传入测试类型,注册对应的测试回调
 * 2.  随机打开一个组件文件(触发checker程序),并触发回调
 * 3.  与预期错误信息进行对比得到结果
 * 3.1 如果不符合预期,则打印错误信息(不符合预期错误),结束测试。
 * 3.2 如果符合预期,获取修复的codeAction并执行修复
 * 4. 修复后的错误诊断与预期进行对比
 * 4.1 如果不符合预期,则打印错误信息(不符合预期错误),结束测试。
 * 4.2 如果符合预期,打印通过信息,结束测试。
 *
 * @param compUri 组件文件Uri
 * @param expectErrorMessageList 预期的错误信息列表
 * @param expectAfterFixedErrorMessageList 通过全部修复codeAction后的剩余错误信息 undefined表示忽略验证修复功能,[]表示预期修复后没有错误,有值表示预期修复后的错误信息
 */
export async function test(
  compUri: ComponentUri,
  checkType: CheckType,
  expectErrorMessageList: string[],
  expectAfterFixedErrorMessageList?: string[],
): Promise<void> {
  if (checkType === "wxml") {
    const wxmlUri = getSiblingUri(compUri, ".wxml");
    // console.log("注册检测完成回调");
    wxmlChecker.registerCheckCompletedCallback(wxmlUri.fsPath, async (diagnosticList) => {
      // 取消回调,确定回调只能被调用一次,因为修复功能还会触发检测(检测完会触发回调)
      wxmlChecker.deregisterCheckCompletedCallback(wxmlUri.fsPath);
      void checkHanle(wxmlUri, diagnosticList, expectErrorMessageList, expectAfterFixedErrorMessageList);
    });
  } else if (checkType === "json") {
    const jsonUri = getSiblingUri(compUri, ".json");
    jsonChecker.registerCheckCompletedCallback(jsonUri, (diagnosticList) => {
      jsonChecker.deregisterCheckCompletedCallback(jsonUri);
      void checkHanle(jsonUri, diagnosticList, expectErrorMessageList, expectAfterFixedErrorMessageList);
    });
  }
  await vscode.workspace.openTextDocument(compUri);
}
