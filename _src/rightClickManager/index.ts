import { vscode } from "#deps";
import { createAnnilComponent } from "./createAnnilComponent.js";

export function rightClickManager(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("annil.createComponent", (uri: vscode.Uri) => createAnnilComponent(uri, false)),
    vscode.commands.registerCommand("annil.createPage", (uri: vscode.Uri) => createAnnilComponent(uri, true)),
  );
}
