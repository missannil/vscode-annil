import * as vscode from "vscode";
import { componentManager } from "../../out/componentManager";
import type { JsonFsPath, WxmlFsPath } from "../../out/componentManager/uriHelper";
import { getDiagnosticList } from "./getDiagnosticList";
import { sleep } from "./sleep";

// 获取修复方案列表,100毫米递归重试，一秒后超时
async function getCodeActions(
  uri: vscode.Uri,
  diagnosticRange: vscode.Range,
  timestamp: number,
): Promise<vscode.CodeAction[]> {
  const codeActions = await vscode.commands.executeCommand(
    "vscode.executeCodeActionProvider",
    uri,
    diagnosticRange,
  ) as vscode.CodeAction[];
  if (codeActions.length === 0) {
    if (Date.now() - timestamp > 1000) {
      return [];
    }
    await sleep(100);

    // console.log("重试");
    return getCodeActions(uri, diagnosticRange, timestamp);
  }

  return codeActions;
}

// 模拟用户点击快速修复按钮,并选者val对应的修复方案,有时存在点击后修复方案列表为空的情况(显示是异步的),需要重试
function executeFixCommand(
  uri: vscode.Uri,
  diagnosticRange: vscode.Range,
  diagnosticIndex: number,
  codeActionIndex: number,
): Promise<readonly vscode.Diagnostic[]> {
  return new Promise<readonly vscode.Diagnostic[]>((resolve) => {
    void (async (): Promise<void> => {
      const codeActions = await getCodeActions(uri, diagnosticRange, Date.now());
      if (codeActions.length === 0) {
        throw `${uri.fsPath} 文件的第${diagnosticIndex}个诊断信息的修复方案列表为空`;
      }
      if (codeActions.length < codeActionIndex + 1) {
        throw `${uri.fsPath} 文件的第${diagnosticIndex}个诊断信息的修复方案列表长度为${codeActions.length},无法选中第${codeActionIndex}个修复方案`;
      }
      // 注册更新诊断列表时的回调函数,为了更准确的得到修复后的诊断列表,避免直接获取诊断列表得到的是未更新前的诊断列表(即修复诊断后的新列表还未生成).
      const fsPath = uri.fsPath as JsonFsPath | WxmlFsPath;
      componentManager.registerCheckedCallback(fsPath, (diagnosticList) => {
        componentManager.unRegisterCheckedCallback(fsPath);
        resolve(diagnosticList);
      });
      const edit = codeActions[codeActionIndex].edit;
      if (edit === undefined) throw ` 索引${codeActionIndex}的 edit 为空 `;

      // 执行修复方案
      void vscode.workspace.applyEdit(edit);
    })();
  });
}

// 修复诊断
export async function fixDiagnostic(
  uri: vscode.Uri,
  diagnosticIndex: number,
  codeActionIndex: number,
): Promise<
  readonly vscode.Diagnostic[]
> {
  const preDiagnosticList = await getDiagnosticList(uri);
  if (preDiagnosticList.length === 0) {
    throw new Error(`${uri.fsPath} 文件的诊断列表为空, 无法修复`);
  }

  return await executeFixCommand(
    uri,
    preDiagnosticList[diagnosticIndex].range,
    diagnosticIndex,
    codeActionIndex,
  );
}

export async function fixAll(uri: vscode.Uri): Promise<void> {
  return new Promise<void>((resolve) => {
    const fsPath = uri.fsPath as JsonFsPath | WxmlFsPath;
    componentManager.registerCheckedCallback(fsPath, () => {
      componentManager.unRegisterCheckedCallback(fsPath);
      resolve();
    });
    // 执行修复所有诊断
    void vscode.commands.executeCommand("annil.fix-all", uri);
    // 有时当前诊断没有修复方案,这导致registerCheckedCallback无法被触发,需要延时2秒后手动取消注册。
    setTimeout(() => {
      componentManager.unRegisterCheckedCallback(fsPath);
      resolve();
    }, 2000);
  });
}
