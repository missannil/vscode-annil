import { vscode } from "#deps";

export const FORMAT_FIXED_DOCUMENT_COMMAND = "annil.formatFixedDocument";

export function addFormatCommand(action: vscode.CodeAction, document: vscode.TextDocument): void {
  action.command = {
    title: "格式化已修复文件",
    command: FORMAT_FIXED_DOCUMENT_COMMAND,
    arguments: [document.uri],
  };
}

export async function formatDocument(document: vscode.TextDocument): Promise<void> {
  const configuration = vscode.workspace.getConfiguration("editor", document.uri);
  const editor = vscode.window.visibleTextEditors.find((item) =>
    item.document.uri.toString() === document.uri.toString()
  );
  const editorTabSize = editor?.options.tabSize;
  const editorInsertSpaces = editor?.options.insertSpaces;
  const options: vscode.FormattingOptions = {
    tabSize: typeof editorTabSize === "number"
      ? editorTabSize
      : configuration.get<number>("tabSize", document.languageId === "json" ? 2 : 4),
    insertSpaces: typeof editorInsertSpaces === "boolean"
      ? editorInsertSpaces
      : configuration.get<boolean>("insertSpaces", true),
  };
  const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
    "vscode.executeFormatDocumentProvider",
    document.uri,
    options,
  );
  if (edits === undefined || edits.length === 0) return;

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);
  await vscode.workspace.applyEdit(workspaceEdit);
}
