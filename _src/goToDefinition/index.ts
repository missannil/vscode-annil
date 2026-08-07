import { vscode } from "#deps";
import { registerAnnilDefinitionProvider } from "./annilDefinitionProvider.js";

/** 初始化 Annil 声明跳转功能。 */
export function goToDefinition(context: vscode.ExtensionContext): void {
  registerAnnilDefinitionProvider(context);
}
