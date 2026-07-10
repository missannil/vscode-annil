import type { CommentStatus, CommentText, CommentType } from "./types.js";

/**
 * annil 注释状态管理器
 *
 * 管理 WXML 节点遍历过程中的注释状态，控制哪些节点需要跳过检查。
 * - 每个注释块有自己的 mark（节点层级标记），保证同层注释不会影响跨层
 * - 状态保持：line 在元素节点检查后自动重置，start 持续到 end
 */
export class CommentManager {
  /** 允许重复标签 默认不允许 */
  #allowRepeatTag = false;
  public get repeatTagStatus(): boolean {
    return this.#allowRepeatTag;
  }
  public disableRepeatTag(): void {
    this.#allowRepeatTag = false;
  }

  /** 当前注释状态 */
  #commentStatus: CommentStatus = "none";
  public get commentStatus(): CommentStatus {
    return this.#commentStatus;
  }

  /** 设置注释状态时留下的标记，同层注释通过 mark 区分 */
  #commentMark: number | string = 0;

  /**
   * 设置注释状态
   * - "end": 重置为 "none"
   * - "repeatTag": 开启允许重复标签
   * - 其他类型：记录 mark 并设置状态
   */
  public setStatus(commentType: CommentType, commentMark: number | string): void {
    if (commentType === "end") {
      this.#commentStatus = "none";

      return;
    }
    if (commentType === "repeatTag") {
      this.#allowRepeatTag = true;

      return;
    }
    this.#commentMark = commentMark;
    this.#commentStatus = commentType;
  }

  /**
   * 更新注释状态（自动过期）
   * - afterElement: 若状态为 "line"，则重置（line 只对紧邻下一个节点生效）
   * - afterNodeList: 若状态不是 "all"，则重置（start 到同层结束即失效）
   */
  public tryExpireStatus(
    when: "afterElement" | "afterNodeList",
    commentMark: number | string,
  ): void {
    // mark 不匹配说明是上层注释，不在当前层处理
    if (this.#commentMark !== commentMark) return;

    if (when === "afterElement" && this.#commentStatus === "line") {
      this.#commentStatus = "none";

      return;
    }
    if (when === "afterNodeList" && this.#commentStatus !== "all") {
      this.#commentStatus = "none";
    }
  }

  /** 当前是否处于被注释（跳过检查）状态 */
  public isCommented(): boolean {
    return this.#commentStatus !== "none";
  }

  /** 判断一段文本是否是 annil 注释 */
  public isAnnilComment(commentText: string): boolean {
    return commentText.trim().startsWith("annil disable ");
  }

  /** 从注释文本中提取注释类型 */
  public getCommentType(commentText: CommentText): CommentType {
    return commentText.trim().split(" ")[2] as CommentType;
  }
}
