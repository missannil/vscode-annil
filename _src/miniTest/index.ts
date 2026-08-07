import { fs, path, vscode } from "#deps";
import { generatePython, getMiniTestOptions } from "./generator.js";

export async function generateMiniTestFile(document: vscode.TextDocument): Promise<void> {
  const options = getMiniTestOptions();
  const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
  const directory = workspace ? path.join(workspace.uri.fsPath, options.outputPath) : path.dirname(document.uri.fsPath);
  const name = path.basename(path.dirname(document.uri.fsPath));
  const target = path.join(directory, `${name}.py`);
  const content = await generatePython(document.uri.fsPath, document.getText(), options);
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(target, content, "utf8");
}

export function miniTest(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerCommand("annil.generateMiniTestClass", async () => {
    const document = vscode.window.activeTextEditor?.document;
    if (!document || document.languageId !== "wxml") {
      void vscode.window.showErrorMessage("非wxml文件无法生成测试文件", { modal: true });

      return;
    }

    try {
      await generateMiniTestFile(document);
      void vscode.window.showInformationMessage("miniTest 文件生成成功");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(`生成miniTest文件失败: ${message}`, { modal: true });
    }
  }));
}
