import * as vscode from "vscode";
import type { TsUri } from "../uriHelper";

// 获取app.json文件(从project.config.json中获取小程序代码的根目录,app.json在根目录下)的resolveAlias字段
export function getAppJsonResolveAlias(tsUri: TsUri): Record<string, string> | undefined {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(tsUri);
  if (workspaceFolder === undefined) return;
  try {
    // 读取project.config.json文件
    const projectConfigJsonPath = `${workspaceFolder.uri.fsPath}/project.config.json`;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const projectConfigJson = require(projectConfigJsonPath);
    const rootPath = projectConfigJson.miniprogramRoot;
    const appJsonPath = `${workspaceFolder.uri.fsPath}/${rootPath}/app.json`;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appJson = require(appJsonPath);

    return appJson.resolveAlias;
  } catch (error) {
    return;
  }
}
