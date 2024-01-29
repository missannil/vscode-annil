import type * as vscode from "vscode";
export function isTSFile(editor: vscode.TextEditor) {
  return editor.document.fileName.endsWith(".ts");
}
