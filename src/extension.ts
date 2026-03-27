import { componentManager } from "./componentManager";
import { configuration } from "./configuration";
import { diagnosticCollection } from "./diagnosticCollection";
import { codeActionsProviderManager } from "./diagnosticFixProvider";

import { rightClickManager } from "./rightClickManager";

// 导入初始化函数而不是整个模块
import { goToDefinition } from "./goToDefinition";
import { miniTest } from "./miniTest/index";
import { path, type vscode } from "./publicModule";
import { initSnippet } from "./snippets";
import { initLogger, logInfo } from "./utils/logger";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  initLogger(context);
  configuration.init(context);
  diagnosticCollection.init(context);
  componentManager.init();
  codeActionsProviderManager.init(context);
  goToDefinition(context);
  rightClickManager(context);
  initSnippet();
  miniTest(context);
  logInfo("Annil extension activated successfully.");
  import(path.resolve(__dirname, "../test/start.js"));
}

export function deactivate(): void {}
