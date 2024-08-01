import * as vscode from "vscode";
import { componentManager } from "./componentManager";
import { diagnosticFixProvider } from "./diagnosticFixProvider";
import { diagnosticManager } from "./diagnosticManager";
import { goToDefinition } from "./goToDefinition";
import { runTest } from "./runTest";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  diagnosticManager.init(context);
  componentManager.init();
  diagnosticFixProvider.init(context);
  goToDefinition.init(context);
  console.log("annil 拓展已激活");
  void runTest();
}

export function deactivate(): void {}
