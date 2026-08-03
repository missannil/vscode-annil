import { type vscode } from "#deps";

import { CommentManager } from "./comment/CommentManager.js";

/**
 * WXML 验证时需要保留的通用作用域信息。
 *
 * 仅保留当前遍历和诊断流程实际使用的状态，避免作用域对象与校验逻辑脱节。
 */
export type WxmlScopeState = {
  /** 当前生效的 wx:for-item 名称栈 */
  wxForItemNames: string[];
  /** 当前生效的 wx:for-index 名称栈 */
  wxForIndexNames: string[];
  /** 当前各节点列表的条件链状态栈 */
  conditionChainStates: Array<"wx:if" | "wx:elif" | "wx:else" | null>;
  /** 外层 chunk 标记栈 */
  outerChunkTagMarks: string[];
  /** 已确认处理过的自定义组件标签 */
  checkedSubComponentTags: Set<string>;
};

/**
 * WXML 验证时的遍历状态。
 *
 * 当前只保留文件头位置这类与遍历顺序直接相关的信息。
 */
export type WxmlTraversalState = {
  isHeadLocation: boolean;
};

/**
 * WXML 验证上下文
 *
 * 通过分层字段把旧代码里的能力拆开：
 * - comment: 注释状态控制
 * - traversal: 遍历顺序相关状态
 * - scope: 循环、条件、组件嵌套等作用域信息
 */
export class WxmlValidationContext {
  /** 注释状态管理器 */
  public readonly comment = new CommentManager();

  /** 当前文件文本行 */
  public readonly textlines: string[];

  /** 当前累计的诊断结果 */
  public readonly diagnosticList: vscode.Diagnostic[];

  /** 遍历状态 */
  public readonly traversal: WxmlTraversalState = {
    isHeadLocation: true,
  };

  /** 作用域状态 */
  public readonly scope: WxmlScopeState = {
    wxForItemNames: [],
    wxForIndexNames: [],
    conditionChainStates: [],
    outerChunkTagMarks: [],
    checkedSubComponentTags: new Set<string>(),
  };

  public constructor(textlines: string[], diagnosticList: vscode.Diagnostic[] = []) {
    this.textlines = textlines;
    this.diagnosticList = diagnosticList;
  }

  /** 进入 wx:for 作用域，压入自定义 item / index 变量名。 */
  public pushWxForScope(itemName: string, indexName: string): void {
    this.scope.wxForItemNames.push(itemName);
    this.scope.wxForIndexNames.push(indexName);
  }

  /** 离开 wx:for 作用域，弹出最近一次压入的变量名。 */
  public popWxForScope(): void {
    // 始终保证成对 pop；若外部调用异常也不抛出
    if (this.scope.wxForItemNames.length > 0) this.scope.wxForItemNames.pop();
    if (this.scope.wxForIndexNames.length > 0) this.scope.wxForIndexNames.pop();
  }

  /** 进入一个节点列表，建立与父节点列表隔离的条件链。 */
  public pushConditionScope(): void {
    this.scope.conditionChainStates.push(null);
  }

  /** 离开一个节点列表，丢弃该层的条件链。 */
  public popConditionScope(): void {
    this.scope.conditionChainStates.pop();
  }

  /** 读取当前节点列表中的前一个条件属性。 */
  public getPreviousConditionAttribute(): "wx:if" | "wx:elif" | "wx:else" | null {
    return this.scope.conditionChainStates.at(-1) ?? null;
  }

  /** 更新当前节点列表的条件链；普通元素会中断条件链。 */
  public setPreviousConditionAttribute(attribute: "wx:if" | "wx:elif" | "wx:else" | null): void {
    if (this.scope.conditionChainStates.length === 0) this.pushConditionScope();
    this.scope.conditionChainStates[this.scope.conditionChainStates.length - 1] = attribute;
  }

  /** 进入 ChunkComponent 作用域，压入 chunk 标记（即变量名/id）。 */
  public pushChunkMark(mark: string): void {
    this.scope.outerChunkTagMarks.push(mark);
  }

  /** 离开 ChunkComponent 作用域，弹出最近一次压入的标记。 */
  public popChunkMark(): void {
    if (this.scope.outerChunkTagMarks.length > 0) this.scope.outerChunkTagMarks.pop();
  }
}
