import * as fs from "fs";
import * as vscode from "vscode";
import { getSiblingUri } from "./getSiblingUri";

export function isComponentFile(uri: vscode.Uri): boolean {
  // 获取兄弟文件wxml的uri
  const wxmlUri = getSiblingUri(uri, ".wxml");
  // 获取兄弟文件json的uri
  const jsonUri = getSiblingUri(uri, ".json");
  // 获取兄弟文件ts的uri
  const tsUri = getSiblingUri(uri, ".ts");

  // 三个文件都存在则返回true表示完整的组件,否则返回false
  return fs.existsSync(wxmlUri.fsPath) && fs.existsSync(jsonUri.fsPath) && fs.existsSync(tsUri.fsPath);
}

export function isTsFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".ts");
}

export function isJsonFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".json");
}

export function isWxmlFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".wxml");
}
