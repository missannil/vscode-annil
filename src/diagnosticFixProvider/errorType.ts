type MissingAttrName = string;
type RepeatedAttrName = string;
type UnknownAttrName = string;
type UnknownTagName = string;
type AttrName = string;

export type MissingComopnent = `${DiagnosticErrorType.missingComopnent}:${MissingAttrName}`;

export type MissingAttr = `${DiagnosticErrorType.missingAttr}:${MissingAttrName}`;

export type UnknownTag = `${DiagnosticErrorType.unknownTag}:${UnknownTagName}`;

export type ErrorValue = `${DiagnosticErrorType.errorValue}:${AttrName}`;

export type NonArrType = `${DiagnosticErrorType.nonArrType}`;

export type NotMatchWithWxFor = DiagnosticErrorType.notMatchWithWxFor;

export type InvalidValue = `${DiagnosticErrorType.invalidValue}:${AttrName}`;

export type Duplicate = `${DiagnosticErrorType.duplicate}:${RepeatedAttrName}`;

export type UnknownAttr = `${DiagnosticErrorType.unknownAttr}:${UnknownAttrName}`;

export type MustacheSyntax = `${DiagnosticErrorType.mustacheSyntax}:${AttrName}`;

export type MissingImport = DiagnosticErrorType.missingImport;

export type UnknownImport = DiagnosticErrorType.unknownImport;

export type MissingNeedfulAttr = `${DiagnosticErrorType.missingNeedfulAttr}:${AttrName}`;

export type ConditionalAttrExisted = `${DiagnosticErrorType.conditionalAttrExisted}:${AttrName}`;

export type MissPrerequisite = `${DiagnosticErrorType.missPrerequisite}:${AttrName}`;

export type WithoutValue = `${DiagnosticErrorType.withoutValue}:${AttrName}`;

export type ShouldwithoutValue = `${DiagnosticErrorType.shouldwithoutValue}:${AttrName}`;

export type DiagnosticMessage =
  | MissingComopnent
  | MissingAttr
  | MissingNeedfulAttr
  | ErrorValue
  | NotMatchWithWxFor
  | InvalidValue
  | Duplicate
  | UnknownAttr
  | MustacheSyntax
  | MissingImport
  | UnknownImport
  | ConditionalAttrExisted
  | MissPrerequisite
  | WithoutValue
  | ShouldwithoutValue
  | UnknownTag;

export enum DiagnosticErrorType {
  unknownTag = "未知标签",
  nonArrType = "非数组类型",
  conditionalAttrExisted = "已有条件属性",
  missPrerequisite = "缺少先决条件",
  withoutValue = "不可无值",
  missingComopnent = "缺少组件",
  missingAttr = "缺少属性",
  errorValue = "错误的值",
  shouldwithoutValue = "不应有值",
  missingNeedfulAttr = "缺少必要属性",
  notMatchWithWxFor = "与wxFor不匹配",
  invalidValue = "无效值",
  duplicate = "重复的属性",
  unknownAttr = "未知的属性",
  mustacheSyntax = "不符合'{{}}'语法",
  missingImport = " 缺少导入的组件",
  unknownImport = "未知的导入",
}
