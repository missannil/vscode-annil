import { type vscode } from "#deps";

import { CommentManager } from "./comment/CommentManager.js";

/**
 * WXML 验证时需要保留的通用作用域信息。
 *
 * 现在先把旧代码里的“可扩展状态”拆成独立区域，后续再逐步接入具体校验逻辑。
 */
export type WxmlScopeState = {
  /** 当前生效的 wx:for-item 名称栈 */
  wxForItemNames: string[];
  /** 当前生效的 wx:for-index 名称栈 */
  wxForIndexNames: string[];
  /** 待处理的条件表达式信息 */
  pendingConditionBlockInfo: null;
  /** 外层 chunk 标记栈 */
  outerChunkTagMarks: string[];
  /** 已出现的 id 列表 */
  existingIdList: string[];
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
    pendingConditionBlockInfo: null,
    outerChunkTagMarks: [],
    existingIdList: [],
    checkedSubComponentTags: new Set<string>(),
  };

  public constructor(textlines: string[], diagnosticList: vscode.Diagnostic[] = []) {
    this.textlines = textlines;
    this.diagnosticList = diagnosticList;
  }
}
