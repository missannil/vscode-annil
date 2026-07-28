/**
 * 诊断消息常量
 *
 * 用于 CodeAction 分发时按消息文本匹配诊断类型。
 * 与 comment/ 和 element/ 下的验证器发出的消息保持一致。
 */
export const DiagMsg = {
  /** 注释文本不合法 */
  invalidCommentText: "无效的注释",
  /** end 注释没有对应的 start */
  noStartedComment: "还没有开始注释不可结束",
  /** 连续两个 line/start/repeatTag 注释 */
  repeatedComment: "重复的注释",
  /** all 注释不在文件头部 */
  invalidCommentLocation: "注释应写在文件头部",
  /** 重复的 id */
  duplicateId: "重复的id",
} as const;

/** 所有支持的诊断消息类型 */
export type DiagnosticMessage = (typeof DiagMsg)[keyof typeof DiagMsg];
