/** annil 注释类型 */
export type CommentType = "line" | "start" | "end" | "all" | "repeatTag";

/**
 * 注释状态（注释生效期间的类型，不包括 end 和 repeatTag）
 *
 * - "none": 无注释生效
 * - "line": 关闭下一行检查
 * - "start": 关闭检查开始，直到遇到 "end"
 * - "all": 全局关闭检查
 */
export type CommentStatus = Exclude<CommentType, "end" | "repeatTag"> | "none";

/** annil 注释前缀 */
type AnnilPrefix = "annil disable ";

/** 合法的 annil 注释文本格式 */
export type CommentText = `${AnnilPrefix}${CommentType}` | `${AnnilPrefix}${CommentType} ${string}`;

/** annil 注释文本枚举 */
export enum CommentTextList {
  全局关闭检查 = "annil disable all",
  关闭下一行检查 = "annil disable line",
  关闭检查开始 = "annil disable start",
  关闭检查结束 = "annil disable end",
  关闭重复组件检查 = "annil disable repeatTag",
}
