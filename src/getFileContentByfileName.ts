import * as vscode from "vscode";

/**
 * 使用vscode的API获取文件内容
 * @param fileName
 * @returns
 */
export async function getFileContentByfileName(fileName: string): Promise<string | false> {
  try {
    const contentBuffer = await vscode.workspace.fs.readFile(
      vscode.Uri.file(fileName),
    );

    return Buffer.from(contentBuffer).toString();
  } catch (error) {
    return false;
  }
}
