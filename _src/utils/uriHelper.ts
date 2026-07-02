import { fs, path, vscode } from "#deps";

/**
 * 判断 URI 是否为小程序组件文件
 *
 * 小程序组件要求同目录下同时存在 .ts .wxml .json 三个兄弟文件。
 * 不管打开的是哪个扩展名，最终检验标准都是三者齐全。
 */
export function isComponentUri(uri: vscode.Uri): boolean {
  // 先快速排除：只有 .ts/.wxml/.json 才可能是组件文件
  const ext = path.extname(uri.fsPath);
  if (ext !== ".ts" && ext !== ".wxml" && ext !== ".json") return false;

  // 三个兄弟文件必须全部存在
  return hasSibling(uri, ".ts") && hasSibling(uri, ".wxml") && hasSibling(uri, ".json");
}

function hasSibling(uri: vscode.Uri, extension: string): boolean {
  const siblingPath = getSiblingFsPath(uri.fsPath, extension);

  return fs.existsSync(siblingPath);
}

function getSiblingFsPath(fsPath: string, extension: string): string {
  return fsPath.replace(/\.[^.]+$/, "") + extension;
}

/** 获取同目录下的兄弟文件 URI */
export function getSiblingUri(uri: vscode.Uri, extension: string): vscode.Uri {
  return vscode.Uri.file(getSiblingFsPath(uri.fsPath, extension));
}

/** 获取组件所在目录路径 */
export function getComponentDir(uri: vscode.Uri): string {
  return path.dirname(uri.fsPath);
}

/** 仅按扩展名快速判断文件类型（不校验兄弟文件） */
export function isTsFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".ts");
}

export function isWxmlFile(uri: vscode.Uri): boolean {
  return uri.fsPath.endsWith(".wxml");
}
