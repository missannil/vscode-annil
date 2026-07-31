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
  /** JSON usingComponents 中未被 TS 引用的组件 */
  unknownImport: "未知的导入",
  /** TS 已引用但 JSON usingComponents 中未声明的组件 */
  missingImport: " 缺少导入的组件",
  /** JSON componentPlaceholder 中未关联有效组件的键 */
  unknownPlaceholder: "未知的占位组件",
  /** JSON 有效组件缺少 componentPlaceholder 配置 */
  missingPlaceholder: "缺少占位组件",
  /** JSON usingComponents 路径与 TS 类型导入推导路径不一致 */
  invalidPath: "无效的路径",
  /** JSON 顶层不受支持的配置键 */
  unknownConfigKey: "未知配置属性",
  /** {{}} 表达式中的非法运算符 */
  illegalOperator: "非法的运算符",
  /** 非法的变量名（不符合 JS 标识符规范） */
  invalidVariable: "无效的变量",
  /** 未知标签 */
  unknownTag: "未知标签",
} as const;

/** 所有支持的诊断消息类型 */
export type DiagnosticMessage = (typeof DiagMsg)[keyof typeof DiagMsg];
