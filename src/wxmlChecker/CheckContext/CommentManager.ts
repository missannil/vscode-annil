export type CommentType = "line" | "start" | "end" | "all" | "repeatTag";

export type CommentStatus = Exclude<CommentType, "end" | "repeatTag"> | "none";
type CommentDescription = string;
type AnnilPrefix = "annil disable ";

export type CommentText = `${AnnilPrefix}${CommentType}` | `${AnnilPrefix}${CommentType} ${CommentDescription}`;

export class CommentManager {
  // 允许重复标签 默认不允许
  #allowRepeatTag = false;
  public get repeatTagStatus(): boolean {
    return this.#allowRepeatTag;
  }

  public disableRepeatTag(): void {
    this.#allowRepeatTag = false;
  }
  // 注释状态
  #commentStatus: CommentStatus = "none";

  public get commentStatus(): CommentStatus {
    return this.#commentStatus;
  }

  // 设置注释状态时留下的标记,在标记相同的情况下才可以取消注释
  #commentMark: number | string = 0;
  // 设置注释状态时,传入的mark用来标记注释的时机,在取消时会用到
  public setCommentStatus(commentType: CommentType, commentMark: number | string): void {
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
  //  更新注释状态
  public updateCommentStatus(when: "afterElementNode" | "afterNodeListChecked", commentMark: number | string): void {
    if (this.#commentMark !== commentMark) return;
    if (when === "afterElementNode") {
      if (this.#commentStatus === "line") {
        this.#commentStatus = "none";
      }

      return;
    }
    if (when === "afterNodeListChecked") {
      if (this.#commentStatus !== "all") {
        this.#commentStatus = "none";
      }
    }
  }
  public isCommented(): boolean {
    return this.#commentStatus !== "none";
  }
  #annilPrefix: AnnilPrefix = "annil disable ";
  public isAnnilComment(commentText: string): boolean {
    return commentText.trim().startsWith(this.#annilPrefix);
  }
  public getCommentType(commentText: CommentText): CommentType {
    return commentText.trim().split(" ")[2] as CommentType;
  }
}
