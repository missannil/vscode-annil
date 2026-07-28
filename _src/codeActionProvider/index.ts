import { vscode } from "#deps";
import { generateCommentCodeActions } from "./commentFix.js";
import { DiagMsg, type DiagnosticMessage } from "./messages.js";

const EXTENSION_NAME = "vscode-annil";

// ---------- 消息类型守卫 ----------

function isCommentError(msg: DiagnosticMessage): boolean {
  return ([
    DiagMsg.invalidCommentText,
    DiagMsg.noStartedComment,
    DiagMsg.repeatedComment,
    DiagMsg.invalidCommentLocation,
  ] as readonly string[]).includes(msg);
}

function isDuplicateId(msg: DiagnosticMessage): boolean {
  return msg === DiagMsg.duplicateId;
}

// ---------- WXML CodeAction 分发 ----------

/**
 * 根据单个诊断消息生成对应的 CodeAction 列表
 */
function generateCodeActionForDiagnostic(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  const msg = diagnostic.message as DiagnosticMessage;

  if (isCommentError(msg)) {
    return generateCommentCodeActions(wxmlUri, diagnostic);
  }

  if (isDuplicateId(msg)) {
    // 重复 id 暂不提供自动修复（用户需手动修改 id 值）
    return [];
  }

  return [];
}

/** 将单个诊断的第一个修复操作追加到全局 WorkspaceEdit。 */
function appendFirstActionEdit(
  fixAllEdit: vscode.WorkspaceEdit,
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): void {
  const action = generateCodeActionForDiagnostic(wxmlUri, diagnostic)[0];
  if (!action?.edit) return;

  for (const [uri, edits] of action.edit.entries()) {
    for (const edit of edits) {
      fixAllEdit.replace(uri, edit.range, (edit as vscode.TextEdit).newText);
    }
  }
}

// ---------- CodeActionProvider ----------

class WxmlCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (context.diagnostics.length === 0) return [];

    const wxmlUri = document.uri;
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      // 只处理本插件产生的诊断
      if (diagnostic.source !== EXTENSION_NAME) continue;
      // 只处理与请求范围相交的诊断（VS Code 可能传入文件中全部诊断）
      if (!diagnostic.range.intersection(range)) continue;
      actions.push(...generateCodeActionForDiagnostic(wxmlUri, diagnostic));
    }

    return actions;
  }
}

// ---------- 注册 ----------

/**
 * 注册 WXML CodeActionProvider 和全局修复命令
 */
export function registerCodeActionProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("wxml", new WxmlCodeActionProvider()),
  );

  // 注册全局修复命令（annil.fix-all）
  context.subscriptions.push(
    vscode.commands.registerCommand("annil.fix-all", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("annil: 没有打开的编辑器");

        return;
      }

      if (editor.document.languageId !== "wxml") {
        vscode.window.showInformationMessage(
          `annil: 当前文件类型为 ${editor.document.languageId}，fix-all 仅支持 .wxml 文件`,
        );

        return;
      }

      const wxmlUri = editor.document.uri;
      const allDiagnostics = vscode.languages.getDiagnostics(wxmlUri);

      if (allDiagnostics.length === 0) {
        vscode.window.showInformationMessage("annil: 当前文件没有诊断信息");

        return;
      }

      const fixAllAction = new vscode.CodeAction("修复全部", vscode.CodeActionKind.QuickFix);
      fixAllAction.edit = new vscode.WorkspaceEdit();

      for (const diagnostic of allDiagnostics) {
        if (diagnostic.source !== EXTENSION_NAME) continue;
        // 每个诊断只执行一个修复操作；存在多个操作时默认使用第一个。
        appendFirstActionEdit(fixAllAction.edit, wxmlUri, diagnostic);
      }

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- WorkspaceEdit 对象始终为真，用 .size 判断
      if (fixAllAction.edit && fixAllAction.edit.size > 0) {
        await vscode.workspace.applyEdit(fixAllAction.edit);
        vscode.window.showInformationMessage("annil: 已修复全部");
        await vscode.commands.executeCommand("editor.action.formatDocument", wxmlUri);
      } else {
        vscode.window.showInformationMessage("annil: 无可用的修复操作");
      }
    }),
  );
}
