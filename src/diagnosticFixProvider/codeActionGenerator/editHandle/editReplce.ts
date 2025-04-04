import * as vscode from "vscode";
import type { WxmlUri } from "../../../componentManager/uriHelper";
import { assertNonNullable } from "../../../utils/assertNonNullable";

export function editReplace(
  wxmlUri: WxmlUri,
  diagnostic: vscode.Diagnostic,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  if (!codeAction) {
    codeAction = new vscode.CodeAction(
      "修复",
      vscode.CodeActionKind.QuickFix,
    );
    codeAction.edit = new vscode.WorkspaceEdit();
  }

  const replaceCode = assertNonNullable(diagnostic.info.replaceCode) as string;

  codeAction.edit && codeAction.edit.replace(wxmlUri, diagnostic.range, replaceCode);

  return codeAction;
}
