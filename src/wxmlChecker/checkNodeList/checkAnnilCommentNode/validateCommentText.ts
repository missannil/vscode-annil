import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import { generateDiagnostic } from "../../tools/generateDiagnostic";

export enum COMMENT_TEXT_LIST {
  全局关闭检查 = "annil disable all",
  关闭下一行检查 = "annil disable line",
  关闭检查开始 = "annil disable start",
  关闭检查结束 = "annil disable end",
  关闭重复组件检查 = "annil disable repeatTag",
}

// 有效的注释内容
function isValidCommentText(commentText: string): boolean {
  return Object.values(COMMENT_TEXT_LIST).some((validComment) => new RegExp(`^${validComment}\\b`).test(commentText));
}

export function validateCommentText(
  curCommentText: string,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
  startLine: number,
): boolean {
  if (!isValidCommentText(curCommentText)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText)],
        DiagnosticErrorType.commentTextError,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
