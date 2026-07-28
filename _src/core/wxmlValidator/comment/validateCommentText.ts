import { vscode } from "#deps";
import { generateDiagnostic } from "./generateDiagnostic.js";
import { CommentTextList } from "./types.js";

/** 检查注释文本是否为合法的 annil 注释 */
function isValidCommentText(commentText: string): boolean {
  return Object.values(CommentTextList).some((validComment) => new RegExp(`^${validComment}\\b`).test(commentText));
}

/**
 * 验证注释文本有效性
 *
 * @returns true 表示文本有效，false 表示已生成诊断
 */
export function validateCommentText(
  curCommentText: string,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
  startLine: number,
): boolean {
  if (!isValidCommentText(curCommentText)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
        "无效的注释",
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
