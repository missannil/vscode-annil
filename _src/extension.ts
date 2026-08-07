import { vscode } from "#deps";
import { registerCodeActionProvider } from "./codeActionProvider/index.js";
import { configuration } from "./configuration/index.js";
import { goToDefinition } from "./goToDefinition/index.js";
import { linter } from "./linter/index.js";
import { rightClickManager } from "./rightClickManager/index.js";
import { initSnippet } from "./snippets/index.js";

function registerCheckAllCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("annil.check-all", async () => {
      // 打开工作区内所有 WXML 文件，借助 onDidOpenTextDocument 触发组件检查。
      const allWxmlFiles = await vscode.workspace.findFiles("**/*.wxml");
      for (const wxmlUri of allWxmlFiles) {
        await vscode.workspace.openTextDocument(wxmlUri);
      }
    }),
  );
}

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("Annil 插件已激活", context.extensionPath);
  void vscode.window.showInformationMessage("Annil 插件已激活");
  initSnippet();
  rightClickManager(context);
  configuration.init(context);
  linter.init(context);
  goToDefinition(context);
  registerCodeActionProvider(context);
  registerCheckAllCommand(context);
}

export function deactivate(): void {
  linter.dispose();
}
