import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../CheckContext";
import type { CommentStatus, CommentType } from "../../CheckContext/CommentManager";
import { generateDiagnostic } from "../../tools/generateDiagnostic";

function isInvalidEndComment(
  commentStatus: CommentStatus,
  commentType: CommentType,
): boolean {
  return commentType === "end" && commentStatus !== "start";
}

export function validateEndComment(
  curCommentType: CommentType,
  curCommentText: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { diagnosticList, textlines, commentStatus } = checkContext;
  if (isInvalidEndComment(commentStatus, curCommentType)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText)],
        DiagnosticErrorType.noStartedComment,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
