import { vscode } from "#deps";
import type { CommentManager } from "./CommentManager.js";
import type { CommentText, CommentType } from "./types.js";
import { validateCommentText } from "./validateCommentText.js";
import { validateEndComment } from "./validateEndComment.js";
import { validateGlobalCommentLocation } from "./validateGlobalCommentLocation.js";
import { validateRepeatComment } from "./validateRepeatComment.js";

/**
 * 对 annil 注释节点进行检查
 *
 * 依次验证：文本有效性 → 不重复 → 位置合法 → end 有对应 start
 *
 * @param commentData - 注释节点文本内容
 * @param startLine - 注释节点所在行号
 * @param commentManager - 注释状态管理器
 * @param diagnosticList - 诊断列表（原地追加）
 * @param textlines - 源码行数组
 * @param isHeadLocation - 当前是否还在文件头部（未遇到元素节点）
 * @returns 注释类型，验证失败时返回 null
 */

export function checkAnnilCommentNode(
  commentData: string,
  startLine: number,
  commentManager: CommentManager,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
  isHeadLocation: boolean,
): CommentType | null {
  // 全局关闭检查状态下不处理任何注释
  if (commentManager.commentStatus === "all") return null;

  const commentText = commentData.trim();

  // 1. 验证文本有效性
  if (!validateCommentText(commentText, diagnosticList, textlines, startLine)) return null;

  const commentType = commentManager.getCommentType(commentText as CommentText);

  // 2. 验证不重复
  if (!validateRepeatComment(commentType, commentText, startLine, commentManager, diagnosticList, textlines)) {
    return null;
  }

  // 3. 验证全局注释位置（all 只能在文件头部）
  if (!validateGlobalCommentLocation(commentType, commentText, startLine, isHeadLocation, diagnosticList, textlines)) {
    return null;
  }

  // 4. 验证 end 有对应 start
  if (!validateEndComment(commentType, commentText, startLine, commentManager, diagnosticList, textlines)) return null;

  return commentType;
}
