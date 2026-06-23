// import { componentManager } from "./componentManager.js";
// import { configuration } from "./configuration.js";
// import { diagnosticCollection } from "./diagnosticCollection.js";
// import { codeActionsProviderManager } from "./diagnosticFixProvider.js";

import { vscode } from "./utils/dependencies.js";

// import { rightClickManager } from "./rightClickManager";

// // 导入初始化函数而不是整个模块
// import { goToDefinition } from "./goToDefinition";
// import { miniTest } from "./miniTest/index";
// import { type vscode } from "./utils/npm.js";
// import { initSnippet } from "./snippets";
// import { initLogger, logInfo } from "../src/utils/logger.js";

const OUTPUT_CHANNEL_NAME = "Annil";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("Annil 插件已激活");
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);
  // initLogger(context);
  // logInfo("Annil extension activated successfully.");
  //   configuration.init(context);
  //   diagnosticCollection.init(context);
  //   componentManager.init();
  //   codeActionsProviderManager.init(context);
  //   goToDefinition(context);
  //   rightClickManager(context);
  //   initSnippet();
  //   miniTest(context);
  //   logInfo("Annil extension activated successfully.");
}

// export function deactivate(): void {}
