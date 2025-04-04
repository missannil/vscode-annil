import * as vscode from "vscode";
import { assertNonNullable } from "../../../utils/assertNonNullable";

export function editDelete(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  if (!codeAction) {
    codeAction = new vscode.CodeAction(
      "删除",
      vscode.CodeActionKind.QuickFix,
    );
    codeAction.edit = new vscode.WorkspaceEdit();
  }

  // 删除指定范围
  assertNonNullable(codeAction.edit).delete(wxmlUri, diagnostic.range);

  return codeAction;
}
