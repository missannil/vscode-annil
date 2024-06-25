import * as path from "path";
import * as vscode from "vscode";
import type { ComponentUri, JsonUri, TsUri, WxmlUri } from "./isComponentUri";
// 小程序组件必要的三个文件扩展名
type ComponentFileExtensions = ".wxml" | ".json" | ".ts";

/**
 * 获取源Uri的兄弟文件的Uri
 * @param sourceUri 源Uri
 * @param siblingExtension 兄弟文件的扩展名
 * @returns 兄弟文件的Uri
 */
export function getSiblingUri(sourceUri: vscode.Uri, siblingExtension: ".json"): JsonUri;

export function getSiblingUri(sourceUri: vscode.Uri, siblingExtension: ".wxml"): WxmlUri;

export function getSiblingUri(sourceUri: vscode.Uri, siblingExtension: ".ts"): TsUri;

export function getSiblingUri(sourceUri: vscode.Uri, siblingExtension: ComponentFileExtensions): ComponentUri {
  const uriExtname = path.extname(sourceUri.fsPath);
  const dir = path.dirname(sourceUri.fsPath);
  const sourceFilename = path.basename(sourceUri.fsPath, uriExtname);
  const siblingPath = path.join(dir, sourceFilename + siblingExtension);
  const siblingUri = vscode.Uri.file(siblingPath);
  if (siblingExtension === ".ts") {
    return siblingUri as TsUri;
  } else if (siblingExtension === ".wxml") {
    return siblingUri as WxmlUri;
  } else {
    return siblingUri as JsonUri;
  }
}
