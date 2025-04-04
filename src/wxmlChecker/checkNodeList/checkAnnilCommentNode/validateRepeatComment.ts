import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../CheckContext";
import type { CommentStatus, CommentType } from "../../CheckContext/CommentManager";
import { generateDiagnostic } from "../../tools/generateDiagnostic";

function isRepeatedComment(
  preCommentStatus: CommentStatus,
  curCommentText: CommentType,
  allowRepeatTag: boolean,
): boolean {
  const startOrLine = ["start", "line"];

  return (startOrLine.includes(preCommentStatus) && startOrLine.includes(curCommentText))
    || allowRepeatTag && curCommentText === "repeatTag";
}

export function validateRepeatComment(
  curCommentType: CommentType,
  commentText: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { commentStatus, diagnosticList, textlines, repeatTagStatus } = checkContext;
  if (isRepeatedComment(commentStatus, curCommentType, repeatTagStatus)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(commentText)],
        DiagnosticErrorType.repeatedComment,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
