import * as vscode from "vscode";
import { componentManager } from "../../out/componentManager";
import type { JsonFsPath, WxmlFsPath } from "../../src/componentManager/uriHelper";

export function assertStrictEquality(actual: unknown[], expected: unknown[]): void {
  if (actual.length !== expected.length) {
    throw new Error("长度不一致");
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`索引 ${i}的值${actual[i]}不符合预期${expected[i]}`);
    }
  }
}

// 替换文件内容
export async function replaceDocumentText(uri: vscode.Uri, documentText: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    vscode.workspace.openTextDocument(uri).then((document) => {
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length),
      );
      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, fullRange, documentText);
      const fsPath = uri.fsPath as JsonFsPath | WxmlFsPath;
      componentManager.registerCheckedCallback(fsPath, () => {
        componentManager.unRegisterCheckedCallback(fsPath);

        resolve(true);
      });
      void vscode.workspace.applyEdit(edit);
    }, console.error);
  });
}
