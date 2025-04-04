import * as vscode from "vscode";
import { assertNonNullable } from "../../utils/assertNonNullable";

import { COMMENT_TEXT_LIST } from "../../wxmlChecker/checkNodeList/checkAnnilCommentNode/validateCommentText";
import { type CommentErrorMessage, DiagnosticErrorType, type DiagnosticMessage } from "../errorType";

function isCommentTextError(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.commentTextError {
  return errMsg === DiagnosticErrorType.commentTextError;
}

function isInvalidGlobalCommentLocation(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.invalidCommentLocation {
  return errMsg === DiagnosticErrorType.invalidCommentLocation;
}

export function isAlreadyCommentMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.repeatedComment {
  return errMsg === DiagnosticErrorType.repeatedComment;
}

export function isCommentTextMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.commentTextError {
  return errMsg === DiagnosticErrorType.commentTextError;
}

export function isShouldEndError(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.shouldEndComment {
  return errMsg === DiagnosticErrorType.shouldEndComment;
}

export function isNoStarted(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.noStartedComment {
  return errMsg === DiagnosticErrorType.noStartedComment;
}
type Title = keyof typeof COMMENT_TEXT_LIST | "删除无效注释";

function createReplaceCodeAction(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  title: Title,
  commentText: string,
): vscode.CodeAction {
  const codeAction = new vscode.CodeAction(
    `${commentText} (${title})`,
    vscode.CodeActionKind.QuickFix,
  );
  codeAction.edit = new vscode.WorkspaceEdit();
  codeAction.edit.replace(wxmlUri, diagnostic.range, commentText);

  return codeAction;
}

function createDeleteCodeAction(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  title: Title,
): vscode.CodeAction {
  const codeAction = new vscode.CodeAction(
    title,
    vscode.CodeActionKind.QuickFix,
  );
  codeAction.edit = new vscode.WorkspaceEdit();
  codeAction.edit.delete(wxmlUri, new vscode.Range(diagnostic.range.start.line, 0, diagnostic.range.end.line + 1, 0));

  return codeAction;
}

function TextErrorHander(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  const commentStatus = assertNonNullable(diagnostic.info.commentStatus);
  const codeActionList: vscode.CodeAction[] = [];
  const isHead = assertNonNullable(diagnostic.info.commentLocationIsHead);

  if (commentStatus === "none") {
    if (isHead) {
      codeActionList.push(createReplaceCodeAction(wxmlUri, diagnostic, "全局关闭检查", COMMENT_TEXT_LIST.全局关闭检查));
    }
    codeActionList.push(
      createReplaceCodeAction(wxmlUri, diagnostic, "关闭下一行检查", COMMENT_TEXT_LIST.关闭下一行检查),
    );
    codeActionList.push(createReplaceCodeAction(wxmlUri, diagnostic, "关闭检查开始", COMMENT_TEXT_LIST.关闭检查开始));
  }
  if (commentStatus === "start") {
    codeActionList.push(createReplaceCodeAction(wxmlUri, diagnostic, "关闭检查结束", COMMENT_TEXT_LIST.关闭检查结束));
  }

  return codeActionList;
}
type ShouldBeNever<T extends never> = T;

export function generateCommentCodeActions(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  errMsg: CommentErrorMessage,
): vscode.CodeAction[] {
  if (isAlreadyCommentMsg(errMsg)) {
    return [createDeleteCodeAction(wxmlUri, diagnostic, "删除无效注释")];
  }
  if (isCommentTextError(errMsg)) {
    return TextErrorHander(wxmlUri, diagnostic);
  }

  if (isShouldEndError(errMsg)) {
    return [createReplaceCodeAction(wxmlUri, diagnostic, "关闭检查结束", COMMENT_TEXT_LIST.关闭检查结束)];
  }
  if (isNoStarted(errMsg)) {
    return [createDeleteCodeAction(wxmlUri, diagnostic, "删除无效注释")];
  }
  if (isInvalidGlobalCommentLocation(errMsg)) {
    return [createDeleteCodeAction(wxmlUri, diagnostic, "删除无效注释")];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type errMsgShouldBeNever = ShouldBeNever<typeof errMsg>;
  throw new Error("未知的注释错误");
}
