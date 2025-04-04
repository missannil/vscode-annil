import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../CheckContext";
import type { CommentType } from "../../CheckContext/CommentManager";
import { generateDiagnostic } from "../../tools/generateDiagnostic";

// 非头部位置的全局注释报错
function isInvalidGlobalCommentLocation(
  isHead: boolean,
  commentType: CommentType,
): boolean {
  return isHead === false && commentType === "all";
}

export function validateGlobalCommentLocation(
  curCommentType: CommentType,
  curCommentText: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { diagnosticList, textlines, isHeadLocation } = checkContext;
  if (isInvalidGlobalCommentLocation(isHeadLocation, curCommentType)) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText)],
        DiagnosticErrorType.invalidCommentLocation,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}
