import { vscode } from "#deps";
import { CommentDiagnosticCode } from "../core/wxmlValidator/comment/diagnosticCodes.js";
import { CommentTextList } from "../core/wxmlValidator/comment/types.js";

// ---------- 原子编辑操作 ----------

/** 创建"替换注释文本"的 CodeAction */
function createReplaceAction(
  wxmlUri: vscode.Uri,
  range: vscode.Range,
  title: string,
  replaceText: string,
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(wxmlUri, range, replaceText);

  return action;
}

/** 创建"删除整行注释"的 CodeAction */
function createDeleteLineAction(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  title: string,
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.edit = new vscode.WorkspaceEdit();
  // 删除诊断所在整行（含下一行的换行符）。
  // 这里必须使用 replace(range, "") 而不是 delete(range)，因为：
  // WorkspaceEdit.entries() 不会遍历由 .delete() 添加的条目，
  // 导致 annil.fix-all 命令无法正确合并删除类修复。
  action.edit.replace(
    wxmlUri,
    new vscode.Range(diagnostic.range.start.line, 0, diagnostic.range.end.line + 1, 0),
    "",
  );

  return action;
}

// ---------- 各注释错误的修复逻辑 ----------

/**
 * "无效的注释" → 提供合法注释替换选项
 *
 * 根据当前注释状态和文件位置提供不同选项：
 * - 状态为 "none" 且在文件头部：all / line / start 三选一
 * - 状态为 "none" 但不在头部：line / start 二选一
 * - 状态为 "start"：end
 */
function fixCommentTextError(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const info = (diagnostic as any).info as { commentStatus?: string; isHeadLocation?: boolean } | undefined;
  const commentStatus = info?.commentStatus ?? "none";
  const isHead = info?.isHeadLocation ?? false;
  const actions: vscode.CodeAction[] = [];
  const range = diagnostic.range;

  if (commentStatus === "none") {
    if (isHead) {
      actions.push(createReplaceAction(wxmlUri, range, "替换为：全局关闭检查", CommentTextList.全局关闭检查));
    }
    actions.push(createReplaceAction(wxmlUri, range, "替换为：关闭下一行检查", CommentTextList.关闭下一行检查));
    actions.push(createReplaceAction(wxmlUri, range, "替换为：关闭检查开始", CommentTextList.关闭检查开始));
  }

  if (commentStatus === "start") {
    actions.push(createReplaceAction(wxmlUri, range, "替换为：关闭检查结束", CommentTextList.关闭检查结束));
  }

  return actions;
}

/**
 * "还没有开始注释不可结束" → 删除该行
 */
function fixNoStartedComment(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return [createDeleteLineAction(wxmlUri, diagnostic, "删除无效的 end 注释")];
}

/**
 * "重复的注释" → 删除该行
 */
function fixRepeatedComment(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return [createDeleteLineAction(wxmlUri, diagnostic, "删除重复的注释")];
}

/**
 * "注释应写在文件头部" → 删除该行
 */
function fixInvalidCommentLocation(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return [createDeleteLineAction(wxmlUri, diagnostic, "删除位置错误的 all 注释")];
}

// ---------- 入口 ----------

/**
 * 根据稳定注释诊断代码生成 CodeAction。
 */
export function generateCommentCodeActions(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code === CommentDiagnosticCode.invalidText) {
    return fixCommentTextError(wxmlUri, diagnostic);
  }
  if (diagnostic.code === CommentDiagnosticCode.noStartedComment) {
    return fixNoStartedComment(wxmlUri, diagnostic);
  }
  if (diagnostic.code === CommentDiagnosticCode.repeatedComment) {
    return fixRepeatedComment(wxmlUri, diagnostic);
  }
  if (diagnostic.code === CommentDiagnosticCode.invalidLocation) {
    return fixInvalidCommentLocation(wxmlUri, diagnostic);
  }

  return [];
}
