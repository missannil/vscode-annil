import type { Comment } from "domhandler";

import type { CheckContext } from "../../CheckContext";

import type { CommentText, CommentType } from "../../CheckContext/CommentManager";
import { validateCommentText } from "./validateCommentText";
import { validateEndComment } from "./validateEndComment";
import { validateGlobalCommentLocation } from "./validateGlobalCommentLocation";
import { validateRepeatComment } from "./validateRepeatComment";

/**
 * 对注释进行检查 返回注释类型或null(诊断出错误时)
 * @param commentNode 注释节点
 * @param textlines 文件文本行
 * @param isHead 当前注释是否为文件头部注释
 */
export function checkAnnilCommentNode(
  commentNode: Comment,
  startLine: number,
  checkContext: CheckContext,
): CommentType | null {
  const { commentStatus, diagnosticList, textlines, getCommentType } = checkContext;
  if (commentStatus === "all") return null;
  const commentText = commentNode.data.trim();
  if (!validateCommentText(commentText, diagnosticList, textlines, startLine)) return null;
  const commentType = getCommentType(commentText as CommentText);
  if (!validateRepeatComment(commentType, commentText, startLine, checkContext)) return null;
  if (!validateGlobalCommentLocation(commentType, commentText, startLine, checkContext)) return null;
  if (!validateEndComment(commentType, commentText, startLine, checkContext)) return null;

  return commentType;
}
