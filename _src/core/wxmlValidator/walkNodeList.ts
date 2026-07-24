import { type Domhandler } from "#deps";

import type { WxmlValidationContext } from "./context.js";

export type WxmlNodeHooks = {
  onElementNode?: (node: Domhandler.Element, startLine: number, context: WxmlValidationContext) => void;
  onTextNode?: (node: Domhandler.Text, startLine: number, context: WxmlValidationContext) => void;
  onCommentNode?: (
    node: Domhandler.Comment,
    startLine: number,
    nodeLevelMark: number,
    context: WxmlValidationContext,
  ) => void;
  onAfterElementNode?: (
    node: Domhandler.Element,
    startLine: number,
    nodeLevelMark: number,
    context: WxmlValidationContext,
  ) => void;
  onLeaveNodeList?: (nodeLevelMark: number, context: WxmlValidationContext) => void;
};

let nodeLevelMarkSeed = 0;

/**
 * 遍历 WXML 节点列表的通用框架。
 *
 * 该层只负责：
 * - 计算节点所在行号
 * - 递归处理元素子节点
 * - 分发节点与遍历生命周期事件到 hooks
 *
 * Annil 注释、节点跳过和具体组件校验均由调用方在 hooks 中处理。
 */
// eslint-disable-next-line complexity
export function walkWxmlNodeList(
  childNodes: Domhandler.ChildNode[],
  context: WxmlValidationContext,
  hooks: WxmlNodeHooks = {},
): void {
  // 为当前递归层分配唯一标记，供外部 hook 识别同一节点列表的生命周期。
  const nodeLevelMark = ++nodeLevelMarkSeed;

  for (const childNode of childNodes) {
    // DOM 的 startIndex 是全文偏移，将其转换为 VS Code 使用的 0 基行号。
    const startLine = getLineNumber(context.textlines, childNode.startIndex ?? 0);

    if (isElementNode(childNode)) {
      // 元素规则是否执行由调用方决定；遍历器始终继续递归其子节点。
      hooks.onElementNode?.(childNode, startLine, context);

      // 元素子节点使用同一个上下文递归处理，以共享调用方维护的状态。
      if (childNode.children.length > 0) {
        walkWxmlNodeList(childNode.children, context, hooks);
      }

      // 通知调用方元素及其完整子树已经处理完成。
      hooks.onAfterElementNode?.(childNode, startLine, nodeLevelMark, context);

      continue;
    }

    if (isTextNode(childNode)) {
      // 是否忽略空白文本或被注释的文本由调用方决定。
      hooks.onTextNode?.(childNode, startLine, context);

      continue;
    }

    if (isCommentNode(childNode)) {
      // 所有注释都交给调用方；调用方自行识别 Annil 注释或普通 HTML 注释。
      hooks.onCommentNode?.(childNode, startLine, nodeLevelMark, context);
    }
  }

  // 通知调用方当前节点列表的递归处理已经结束。
  hooks.onLeaveNodeList?.(nodeLevelMark, context);
}

/** 仅将 htmlparser2 标记为 tag 的节点视为可校验的 WXML 元素。 */
function isElementNode(node: Domhandler.ChildNode): node is Domhandler.Element {
  return node.type === "tag";
}

/** 仅将 htmlparser2 标记为 text 的节点交给文本 hook。 */
function isTextNode(node: Domhandler.ChildNode): node is Domhandler.Text {
  return node.type === "text";
}

/** 仅将 htmlparser2 标记为 comment 的节点交给注释 hook。 */
function isCommentNode(node: Domhandler.ChildNode): node is Domhandler.Comment {
  return node.type === "comment";
}

/**
 * 根据节点全文偏移量计算 0 基行号。
 * 每行额外加 1 是为了计入以 "\n" 分割后被移除的换行符。
 */
function getLineNumber(textlines: string[], startIndex: number): number {
  let currentIndex = 0;

  for (let lineIndex = 0; lineIndex < textlines.length; lineIndex++) {
    const lineLength = textlines[lineIndex].length + 1;
    // 偏移量落在当前行的字符范围内时，当前索引就是目标行。
    if (startIndex < currentIndex + lineLength) {
      return lineIndex;
    }
    // 累加已经越过的文本与行尾换行符，继续寻找下一行。
    currentIndex += lineLength;
  }

  // 解析器没有提供有效偏移量时回退到首行，保证调用方可安全创建诊断范围。
  return 0;
}
