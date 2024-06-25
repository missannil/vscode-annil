import * as vscode from "vscode";
// import { runTest } from "./runTest";
import { diagnosticFixProvider } from "./diagnosticFixProvider";
import { goToDefinition } from "./goToDefinition";
import { diagnosticManager } from "./diagnosticManager";
import { componentManager } from "./componentManager";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  diagnosticManager.init(context);
  componentManager.init();
  diagnosticFixProvider.init(context);
  goToDefinition.init(context);
  // void runTest();
}

export function deactivate(): void {}
