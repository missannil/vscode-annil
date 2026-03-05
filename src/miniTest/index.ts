import { path, vscode } from "../publicModule";
import { generateTestFile } from "./generateTestFile";
import type { FileName, FileText, FsPath } from "./types";

export function miniTest(context: vscode.ExtensionContext): void {
  // 注册快捷键 Ctrl+Shift+T 来生成测试文件
  context.subscriptions.push(vscode.commands.registerCommand("annil.generateTestFileForMiniTest", async () => {
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    // 确保当前打开的文件是一个wxml文件
    if (!document || document.languageId !== "wxml") {
      void vscode.window.showErrorMessage("非wxml文件无法生成测试文件");

      return;
    }
    // 生成测试文件
    const fsPath: FsPath = document.uri.fsPath as FsPath;
    const wxmlFileName: FileName = path.basename(fsPath, ".wxml") as FileName;
    const text: FileText = document.getText() as FileText;
    generateTestFile(fsPath, wxmlFileName, text);
  }));
}
