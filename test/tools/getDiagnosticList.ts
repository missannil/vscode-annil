import * as vscode from "vscode";

import { assertNonNullable } from "../../out/utils/assertNonNullable";
import { sleep } from "./sleep";

import { diagnosticCollection } from "../../out/diagnosticCollection";

function isDocumentOpen(uri: vscode.Uri): boolean {
  return Boolean(vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === uri.fsPath));
}

// 获取诊断列表 100毫秒递归重试，一秒后超时
export async function getDiagnosticList(
  uri: vscode.Uri,
  delay = 1000,
  timestamp: number = Date.now(),
): Promise<readonly vscode.Diagnostic[]> {
  if (isDocumentOpen(uri)) {
    const diagnosticList = assertNonNullable(diagnosticCollection.get(uri));
    if (diagnosticList.length === 0) {
      if (Date.now() - timestamp > delay) {
        return [];
      }
      await sleep(100);

      return getDiagnosticList(uri, delay, timestamp);
    }

    return diagnosticList;
  } else {
    await vscode.workspace.openTextDocument(uri);

    return getDiagnosticList(uri, delay, timestamp);
  }
}
