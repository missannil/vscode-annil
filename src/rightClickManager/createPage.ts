import * as vscode from "vscode";
import { createAnnilComponent } from "./createAnnilComponent";

export function createPage(): vscode.Disposable {
  // 为工作区目录的右键菜单添加 `建立页面`功能选项
  return vscode.commands.registerCommand(
    "annil.createPage",
    async (uri: vscode.Uri) => {
      await createAnnilComponent(uri, true);
    },
  );
}
