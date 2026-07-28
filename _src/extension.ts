import { vscode } from "#deps";
import { registerCodeActionProvider } from "./codeActionProvider/index.js";
import { configuration } from "./configuration/index.js";
import { linter } from "./linter/index.js";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("Annil 插件已激活");
  configuration.init(context);
  linter.init(context);
  registerCodeActionProvider(context);
}

export function deactivate(): void {
  linter.dispose();
}
