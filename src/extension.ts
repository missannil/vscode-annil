import * as vscode from "vscode";
import { componentManager } from "./componentManager";
import { configuration } from "./configuration";
import { diagnosticFixProvider } from "./diagnosticFixProvider";
import { diagnosticManager } from "./diagnosticManager";
import { goToDefinition } from "./goToDefinition";
// import { runTest } from "./runTest";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  configuration.init(context);
  diagnosticManager.init(context);
  componentManager.init();
  diagnosticFixProvider.init(context);
  diagnosticFixProvider.registerCommandOfFixAll(context);
  goToDefinition.init(context);

  console.log("annil 拓展已激活");
  // void runTest();
}

export function deactivate(): void {}
