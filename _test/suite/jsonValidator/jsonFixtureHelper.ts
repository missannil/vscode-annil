import { vscode } from "#deps";

/**
 * 恢复被 Code Action 修改的 JSON fixture。
 *
 * 常规路径通过编辑器保存，确保打开文档和磁盘保持一致；在 VS Code 拒绝测试
 * 编辑器提交时，直接写回磁盘，避免失败的清理钩子污染后续测试运行。
 */
export async function restoreJsonFixture(uri: vscode.Uri, originalText: string): Promise<void> {
  const document = await vscode.workspace.openTextDocument(uri);
  if (document.getText() === originalText) return;

  const editor = await vscode.window.showTextDocument(document);
  const restored = await editor.edit((edit) => {
    edit.replace(
      new vscode.Range(new vscode.Position(0, 0), document.positionAt(document.getText().length)),
      originalText,
    );
  });
  if (restored) {
    await document.save();

    return;
  }

  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(originalText));
}
