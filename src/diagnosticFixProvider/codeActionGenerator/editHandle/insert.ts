import * as vscode from "vscode";
import type { WxmlUri } from "../../../componentManager/uriHelper";
import { assertNonNullable } from "../../../utils/assertNonNullable";

export function editInsert(
  wxmlUri: WxmlUri,
  diagnostic: vscode.Diagnostic,
  missingAttrName: string,
  insertCharactor: string,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  if (!codeAction) {
    codeAction = new vscode.CodeAction(
      `添加${missingAttrName}属性`,
      vscode.CodeActionKind.QuickFix,
    );
    codeAction.edit = new vscode.WorkspaceEdit();
  }

  assertNonNullable(codeAction.edit).insert(
    wxmlUri,
    diagnostic.range.end,
    insertCharactor,
  );
  // 添加格式化文档的命令会在edit执行后执行
  codeAction.command = {
    title: "格式化文档",
    command: "editor.action.formatDocument",
    arguments: [wxmlUri],
  };

  return codeAction;
}
