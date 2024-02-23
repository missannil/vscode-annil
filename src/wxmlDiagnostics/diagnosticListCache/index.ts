import type * as vscode from "vscode";

type WxmlFilePath = string;

// 诊断信息的缓存
export const diagnosticListCache: Record<WxmlFilePath, vscode.Diagnostic[] | undefined> = {};

export function getDiagnosticListFromCache(wxmlFilePath: WxmlFilePath): vscode.Diagnostic[] | undefined {
  return diagnosticListCache[wxmlFilePath];
}

export function setDiagnosticListToCache(
  wxmlFilePath: WxmlFilePath,
  diagnosticList: vscode.Diagnostic[],
): vscode.Diagnostic[] {
  return diagnosticListCache[wxmlFilePath] = diagnosticList;
}
