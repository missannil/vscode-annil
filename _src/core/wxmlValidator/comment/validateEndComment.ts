import { vscode } from "#deps";
import type { CommentManager } from "./CommentManager.js";
import { generateDiagnostic } from "./generateDiagnostic.js";
import type { CommentType } from "./types.js";

/**
 * 验证结束注释 end 是否有对应的 start
 *
 * @returns true 表示有效，false 表示已生成诊断
 */
export function validateEndComment(
  curCommentType: CommentType,
  curCommentText: string,
  startLine: number,
  commentManager: CommentManager,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
): boolean {
  if (curCommentType === "end" && commentManager.commentStatus !== "start") {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
        "还没有开始注释不可结束",
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
