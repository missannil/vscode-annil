import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getSiblingUri } from "../componentManager/getSiblingUri";
type SubComponentTag = string;
type SubComponentPath = string;
type UsingComponents = Record<SubComponentTag, SubComponentPath>;
type JsonConfig = {
  component?: true;
  usingComponents?: UsingComponents;
};
class GoToDefinition {
  // 从当前文件路径向上查找到包含project.config.json文件的目录
  private async getMiniprogramRoot(currentPath: string): Promise<string> {
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

  private async getAbsolutePath(fsPath: string, configPath: string): Promise<string> {
    // 从当前文件路径向上查找到包含project.config.json文件的目录,拿到miniprogramRoot配置值
    const miniprogramRoot = await this.getMiniprogramRoot(fsPath);
    const parts = fsPath.split(path.sep);
    const index = parts.indexOf(miniprogramRoot.replace(/\//g, ""));

    return path.join(...parts.slice(0, index + 1), configPath);
  }

  private async getWxmlFsPath(configPath: string, currentFsPath: string): Promise<string> {
    let componentPath: string; // 小程序配置自定义组件路径时没有后缀名
    // 以`/`开头的路径是从小程序project.config.json的miniprogramRoot字段开始的
    if (configPath.startsWith("/")) {
      componentPath = await this.getAbsolutePath(currentFsPath, configPath);
    } else {
      // 相对路径(./开始的),vscode拓展(`WXML`)也有此功能,但不支持绝对路径
      componentPath = path.join(path.dirname(currentFsPath), configPath);
    }
    const tempPath = componentPath + ".wxml";
    const wxmlFsPath = fs.existsSync(tempPath)
      ? tempPath
      : path.join(componentPath, "index.wxml");

    return wxmlFsPath;
  }
  private async getJsonConfig(uri: vscode.Uri): Promise<JsonConfig | undefined> {
    const jsonUri = getSiblingUri(uri, ".json");
    try {
      return JSON.parse((await vscode.workspace.openTextDocument(jsonUri)).getText()) as JsonConfig;
    } catch (error) {
      return undefined;
    }
  }
  private registerDefinitionProvider(context: vscode.ExtensionContext): void {
    const provider = vscode.languages.registerDefinitionProvider({ pattern: "**/*.wxml" }, {
      provideDefinition: async (document, position) => {
        const cursorRange = document.getWordRangeAtPosition(position);
        const WordText = document.getText(cursorRange);
        const wxmlUri = document.uri;
        const jsonConfig = await this.getJsonConfig(wxmlUri);
        if (!jsonConfig) return null;
        const usingComponents = jsonConfig.usingComponents || {};
        if (WordText in usingComponents) {
          const configPath = usingComponents[WordText];
          const wxmlFsPath = await this.getWxmlFsPath(configPath, wxmlUri.fsPath);

          return new vscode.Location(vscode.Uri.file(wxmlFsPath), new vscode.Position(0, 0));
        }
      },
    });
    context.subscriptions.push(provider);
  }
  public init(context: vscode.ExtensionContext): void {
    this.registerDefinitionProvider(context);
  }
}

export const goToDefinition = new GoToDefinition();
