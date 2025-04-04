import * as vscode from "vscode";

// 获取文件内容
export async function getDocumentText(componentUri: vscode.Uri): Promise<string> {
  return (await vscode.workspace.openTextDocument(componentUri)).getText();
}
