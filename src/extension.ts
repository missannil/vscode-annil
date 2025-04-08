import { componentManager } from "./componentManager";
import { configuration } from "./configuration";
import { diagnosticCollection } from "./diagnosticCollection";
import { codeActionsProviderManager } from "./diagnosticFixProvider";

import { rightClickManager } from "./rightClickManager";

// 导入初始化函数而不是整个模块
import { path, type vscode } from "./exportVscode";
import { goToDefinition } from "./goToDefinition";
import { initSnippet } from "./snippets";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  configuration.init(context);
  diagnosticCollection.init(context);
  componentManager.init();
  codeActionsProviderManager.init(context);
  goToDefinition(context);
  rightClickManager(context);
  initSnippet();
  import(path.resolve(__dirname, "../test/start.js"));
}

export function deactivate(): void {}
