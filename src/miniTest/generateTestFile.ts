import { path, vscode } from "../publicModule";
import { generateTextForPy } from "./generateTextForPy";
import { getTestFilePath } from "./getFilePath";
import type { ComponentName, FileText, FsPath } from "./types";

export async function generateTestFile(wxmlFsPath: FsPath, wxmlText: FileText): Promise<void> {
  // 预定组件的目录名就是组件的名字
  const componentName = path.basename(path.dirname(wxmlFsPath)) as ComponentName;
  // 1. 生成py文件内容
  const testFileContent = await generateTextForPy(wxmlFsPath, componentName, wxmlText);
  const fileBytes = new TextEncoder().encode(testFileContent);
  //  2. 获取py文件的存放路径
  const testFilePath = getTestFilePath(wxmlFsPath, componentName);
  // 3.  写入py文件
  vscode.workspace.fs.writeFile(vscode.Uri.file(testFilePath), fileBytes).then(() => {
    // void vscode.window.showInformationMessage("py文件生成成功", { modal: true });
    void 0;
  }, (error) => {
    void vscode.window.showErrorMessage(`生成py文件失败: ${error.message}`, { modal: true });
  });
}
