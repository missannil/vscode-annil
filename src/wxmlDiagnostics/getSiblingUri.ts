import * as path from "path";
import * as vscode from "vscode";

// 小程序组件必要的三个文件扩展名
type ComponentFileExtensions = ".wxml" | ".json" | ".ts";

/**
 * 获取源Uri的兄弟文件的Uri
 * @param sourceUri 源Uri
 * @param siblingExtension 兄弟文件的扩展名
 * @returns 兄弟文件的Uri
 */
export function getSiblingUri(sourceUri: vscode.Uri, siblingExtension: ComponentFileExtensions): vscode.Uri {
  const uriExtname = path.extname(sourceUri.fsPath);

  if (uriExtname === siblingExtension) {
    return sourceUri;
  }

  const dir = path.dirname(sourceUri.fsPath);

  const sourceFilename = path.basename(sourceUri.fsPath, uriExtname);

  const siblingPath = path.join(dir, sourceFilename + siblingExtension);

  return vscode.Uri.file(siblingPath);
}
