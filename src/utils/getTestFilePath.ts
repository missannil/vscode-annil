import * as path from "path";
import * as vscode from "vscode";

// 获取不带后缀的uri文件名

export function getTestFilePath(uri: vscode.Uri): string {
  const fsPath = uri.fsPath;
  if (!fsPath.includes("test")) {
    throw new Error("路径中不包含 \"test\"");
  }
  const parts = fsPath.split(`test${path.sep}`);

  return parts[1];
}
