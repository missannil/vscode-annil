import { vscode } from "#deps";
import type { CommentManager } from "./CommentManager.js";
import { generateDiagnostic } from "./generateDiagnostic.js";
import type { CommentStatus, CommentType } from "./types.js";

/**
 * 检查是否重复注释
 * - 已有 start/line 状态时不能再出现 start/line
 * - 已有 repeatTag 状态时不能再出现 repeatTag
 */
function isRepeatedComment(
  preCommentStatus: CommentStatus,
  curCommentType: CommentType,
  allowRepeatTag: boolean,
): boolean {
  const startOrLine = ["start", "line"];

  return (
    (startOrLine.includes(preCommentStatus) && startOrLine.includes(curCommentType))
    || (allowRepeatTag && curCommentType === "repeatTag")
  );
}

/**
 * 验证注释是否重复
 *
 * @returns true 表示不重复，false 表示已生成诊断
 */
export function validateRepeatComment(
  curCommentType: CommentType,
  curCommentText: string,
  startLine: number,
  commentManager: CommentManager,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
): boolean {
  if (isRepeatedComment(commentManager.commentStatus, curCommentType, commentManager.repeatTagStatus)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
        "重复的注释",
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
