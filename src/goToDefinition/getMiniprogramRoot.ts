import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// 从当前文件路径向上查找到包含project.config.json文件的目录
export async function getMiniprogramRoot(currentPath: string): Promise<string> {
  let currentDir = path.dirname(currentPath);
  do {
    const projectConfigPath = path.join(currentDir, "project.config.json");
    if (fs.existsSync(projectConfigPath)) {
      const projectConfigUri = vscode.Uri.file(projectConfigPath);
      const projectConfigContent = await vscode.workspace.fs.readFile(projectConfigUri);

      return JSON.parse(projectConfigContent.toString()).miniprogramRoot;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // 如果已经到达了文件系统的根目录，但还没有找到配置文件，抛出一个错误
      throw new Error("project.config.json not found");
    }
    currentDir = parentDir;
    /* eslint-disable no-constant-condition */
  } while (true);
}
