import { vscode } from "../publicModule";
import { generateTestFileContent } from "./generateTestFileContent";
import { getTestFilePath } from "./getFilePath";
import type { FileName, FileText, FsPath } from "./types";

export function generateTestFile(fsPath: FsPath, fileName: FileName, text: FileText): void {
  // 1. 生成测试文件内容
  const testFileContent = generateTestFileContent(fileName, text);
  const fileBytes = new TextEncoder().encode(testFileContent);
  //  2. 获取测试文件的存放路径
  const testFilePath = getTestFilePath(fsPath, fileName);
  // 3.  写入测试文件
  vscode.workspace.fs.writeFile(vscode.Uri.file(testFilePath), fileBytes).then(() => {
    void vscode.window.showInformationMessage(`测试文件已生成: ${testFilePath}`);
  }, (error) => {
    void vscode.window.showErrorMessage(`生成测试文件失败: ${error.message}`);
  });
}
