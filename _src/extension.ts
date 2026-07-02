import { vscode } from "#deps";
import { configuration } from "./configuration/index.js";
import { linter } from "./linter/index.js";

// import { rightClickManager } from "./rightClickManager";

// // 导入初始化函数而不是整个模块
// import { goToDefinition } from "./goToDefinition";
// import { miniTest } from "./miniTest/index";
// import { type vscode } from "./utils/npm.js";
// import { initSnippet } from "./snippets";
// import { initLogger, logInfo } from "../src/utils/logger.js";

// const OUTPUT_CHANNEL_NAME = "Annil";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("Annil 插件已激活");
  configuration.init(context);
  linter.init(context);
}

export function deactivate(): void {
  linter.dispose();
}
