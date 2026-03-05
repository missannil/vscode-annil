import { path, vscode } from "../publicModule";
import type { FileName, FsPath } from "./types";

/**
 * 解析测试文件的路径
 * @description
 * 1. 工作区不存在或配置路径为空时,测试文件将放在当前wxml文件所在目录下。
 * 2. 如果配置了测试文件路径,就以工作区根目录为基础生成绝对路径。
 * @param document
 * @returns 测试文件的路径，如果无法生成则返回undefined
 */
export function getTestFilePath(fsPath: FsPath, wxmlFileName: FileName): FsPath {
  // 1. 获取工作区根目录
  const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
  // 2. 如果配置了测试文件路径,就以工作区根目录为基础生成绝对路径
  const configuredPath = vscode.workspace
    .getConfiguration()
    .get<string>("annil.testFilePath")?.trim();

  const testFileName = `${wxmlFileName}.py`;
  // 4. 测试文件的目录
  let testFileFolderPath: string;

  if (!workspaceRoot || configuredPath === undefined || configuredPath === "") {
    // 工作区不存在或配置路径为空时,测试文件将放在当前wxml文件所在目录下
    testFileFolderPath = path.dirname(fsPath);
  } else {
    // 以工作区根目录为基础生成绝对路径
    testFileFolderPath = path.join(workspaceRoot.uri.fsPath, configuredPath);
  }

  return path.join(testFileFolderPath, testFileName) as FsPath;
}
