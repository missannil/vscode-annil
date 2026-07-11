import { type Domhandler } from "#deps";

import { checkAnnilCommentNode } from "./comment/checkAnnilCommentNode.js";
import type { WxmlValidationContext } from "./context.js";

export type WxmlNodeHooks = {
  onElementNode?: (node: Domhandler.Element, startLine: number, context: WxmlValidationContext) => void;
  onTextNode?: (node: Domhandler.Text, startLine: number, context: WxmlValidationContext) => void;
  onCommentNode?: (
    node: Domhandler.Comment,
    startLine: number,
    context: WxmlValidationContext,
    commentType: ReturnType<typeof checkAnnilCommentNode>,
  ) => void;
};

let nodeLevelMarkSeed = 0;

/**
 * 遍历 WXML 节点列表的通用框架。
 *
 * 该层只负责：
 * - 计算节点所在行号
 * - 处理 annil 注释状态
 * - 分发 element / text / comment 节点到 hooks
 *
 * 具体的组件校验逻辑由调用方在 hooks 中补充。
 */
// eslint-disable-next-line complexity
export function walkWxmlNodeList(
  childNodes: Domhandler.ChildNode[],
  context: WxmlValidationContext,
  hooks: WxmlNodeHooks = {},
): void {
  const nodeLevelMark = ++nodeLevelMarkSeed;

  for (const childNode of childNodes) {
    const startLine = getLineNumber(context.textlines, childNode.startIndex ?? 0);

    if (isElementNode(childNode)) {
      context.traversal.isHeadLocation = false;

      if (!context.comment.isCommented()) {
        hooks.onElementNode?.(childNode, startLine, context);
      }

      if (childNode.children.length > 0) {
        walkWxmlNodeList(childNode.children, context, hooks);
      }

      context.comment.tryExpireStatus("afterElement", nodeLevelMark);
      context.comment.disableRepeatTag();

      continue;
    }

    if (isTextNode(childNode)) {
      const text = childNode.data.trim();
      if (text === "" || context.comment.isCommented()) continue;

      hooks.onTextNode?.(childNode, startLine, context);

      continue;
    }

    if (isCommentNode(childNode)) {
      const commentData = childNode.data;
      if (typeof commentData !== "string") continue;
      if (!context.comment.isAnnilComment(commentData)) continue;

      const commentType = checkAnnilCommentNode(
        commentData,
        startLine,
        context.comment,
        context.diagnosticList,
        context.textlines,
        context.traversal.isHeadLocation,
      );

      hooks.onCommentNode?.(childNode, startLine, context, commentType);

      if (commentType) {
        context.comment.setStatus(commentType, nodeLevelMark);
      }
    }
  }

  context.comment.tryExpireStatus("afterNodeList", nodeLevelMark);
}

function isElementNode(node: Domhandler.ChildNode): node is Domhandler.Element {
  return node.type === "tag";
}

function isTextNode(node: Domhandler.ChildNode): node is Domhandler.Text {
  return node.type === "text";
}

function isCommentNode(node: Domhandler.ChildNode): node is Domhandler.Comment {
  return node.type === "comment";
}

function getLineNumber(textlines: string[], startIndex: number): number {
  let currentIndex = 0;

  for (let lineIndex = 0; lineIndex < textlines.length; lineIndex++) {
    const lineLength = textlines[lineIndex].length + 1;
    if (startIndex < currentIndex + lineLength) {
      return lineIndex;
    }
    currentIndex += lineLength;
  }

  return 0;
}
