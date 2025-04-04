export function isDuplicateAttrMsg(errMsg: string): errMsg is DiagnosticErrorType.duplicateAttr {
  return errMsg === DiagnosticErrorType.duplicateAttr;
}

export function isMustacheSyntaxMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.mustacheSyntax {
  return errMsg === DiagnosticErrorType.mustacheSyntax;
}

export function isMissingAttrMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missingAttr {
  return errMsg === DiagnosticErrorType.missingAttr;
}

export function isMissingWxkeyMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missingWxkey {
  return errMsg === DiagnosticErrorType.missingWxkey;
}

export function isUnknownAttrMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.unknownAttr {
  return errMsg === DiagnosticErrorType.unknownAttr;
}

export function isErrorValueMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.errorValue {
  return errMsg === DiagnosticErrorType.errorValue;
}

export function isMissingWxfor(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missingWxfor {
  return errMsg === DiagnosticErrorType.missingWxfor;
}

export function isEmptyBlockTagMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.emptyBlockTag {
  return errMsg === DiagnosticErrorType.emptyBlockTag;
}

export function isConditionalAttrExistedMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.conditionalAttrExisted {
  return errMsg === DiagnosticErrorType.conditionalAttrExisted;
}

export function isMissPrerequisiteMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.missPrerequisite {
  return errMsg === DiagnosticErrorType.missPrerequisite;
}

export function isNotWxForItemValueMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.notWxForItemValue {
  return errMsg === DiagnosticErrorType.notWxForItemValue;
}

export function isInvalidExpressionMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.invalidExpression {
  return errMsg === DiagnosticErrorType.invalidExpression;
}

export function isInvalidTernaryValueMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.invalidTernaryValue {
  return errMsg === DiagnosticErrorType.invalidTernaryValue;
}

export function isSingleMustacheSyntaxConstraintMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.singleMustacheSyntaxConstraint {
  return errMsg === DiagnosticErrorType.singleMustacheSyntaxConstraint;
}

export function isNotFoundMustacheSyntaxMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.notFoundMustacheSyntax {
  return errMsg === DiagnosticErrorType.notFoundMustacheSyntax;
}

export function isNotRootDataMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.notRootData {
  return errMsg === DiagnosticErrorType.notRootData;
}

export function isNonSubComponentOrWxforVariableMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.nonSubComponentOrWxforVariable {
  return errMsg === DiagnosticErrorType.nonSubComponentOrWxforVariable;
}

export function isNonRootComponentDataOrWxforVariableMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.nonRootComponentDataOrWxforVariable {
  return errMsg === DiagnosticErrorType.nonRootComponentDataOrWxforVariable;
}

export function isWithoutValueMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.withoutValue {
  return errMsg === DiagnosticErrorType.withoutValue;
}

export function isCommentErrorMsg(errMsg: DiagnosticMessage): errMsg is CommentErrorMessage {
  return errMsg === DiagnosticErrorType.repeatedComment || errMsg === DiagnosticErrorType.commentTextError
    || errMsg === DiagnosticErrorType.invalidCommentLocation || errMsg === DiagnosticErrorType.shouldEndComment
    || errMsg === DiagnosticErrorType.noStartedComment;
}

export function isTernaryValueQuantityMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.ternaryValueQuantity {
  return errMsg === DiagnosticErrorType.ternaryValueQuantity;
}

export function isInvalidVariableMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.invalidVariable {
  return errMsg === DiagnosticErrorType.invalidVariable;
}

export function isRepeatedWxForItemDefaultMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.repeatedWxForItemDefault {
  return errMsg === DiagnosticErrorType.repeatedWxForItemDefault;
}

export function isRepeatedWxForIndexDefaultMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.repeatedWxForIndexDefault {
  return errMsg === DiagnosticErrorType.repeatedWxForIndexDefault;
}

export function isValueShouldNotExistMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.valueShouldNotExist {
  return errMsg === DiagnosticErrorType.valueShouldNotExist;
}

export function isInvalidTernaryExpressionMsg(
  errMsg: DiagnosticMessage,
): errMsg is DiagnosticErrorType.invalidTernaryExpression {
  return errMsg === DiagnosticErrorType.invalidTernaryExpression;
}

export type CommentErrorMessage =
  | DiagnosticErrorType.commentTextError
  | DiagnosticErrorType.invalidCommentLocation
  | DiagnosticErrorType.repeatedComment
  | DiagnosticErrorType.shouldEndComment
  | DiagnosticErrorType.noStartedComment;

// 诊断信息 鼠标悬停时显示的信息
export type DiagnosticMessage =
  | DiagnosticErrorType.singleMustacheSyntaxConstraint
  | DiagnosticErrorType.missingAttr
  | DiagnosticErrorType.errorValue
  | DiagnosticErrorType.missingWxfor
  | DiagnosticErrorType.emptyBlockTag
  | DiagnosticErrorType.invalidValue
  | DiagnosticErrorType.unknownAttr
  | DiagnosticErrorType.mustacheSyntax
  | DiagnosticErrorType.notRootData
  | DiagnosticErrorType.conditionalAttrExisted
  | DiagnosticErrorType.missPrerequisite
  | DiagnosticErrorType.withoutValue
  | DiagnosticErrorType.valueShouldNotExist
  | DiagnosticErrorType.unknownTag
  | DiagnosticErrorType.invalidVariable
  | DiagnosticErrorType.notWxForItemValue
  | DiagnosticErrorType.notWxForOrRootValues
  | DiagnosticErrorType.shouldWxForItemOrSubCompData
  | DiagnosticErrorType.shouldWxForOrRootArrayTypeData
  | DiagnosticErrorType.invalidEvent
  | DiagnosticErrorType.missingWxkey
  | DiagnosticErrorType.repeatedWxForItem
  | DiagnosticErrorType.repeatedWxForIndex
  | DiagnosticErrorType.repeatedWxForItemDefault
  | DiagnosticErrorType.repeatedWxForIndexDefault
  | DiagnosticErrorType.shouldWxForOrRootBooleanTypeData
  | DiagnosticErrorType.nonSubComponentOrWxforVariable
  | DiagnosticErrorType.nonRootComponentDataOrWxforVariable
  | DiagnosticErrorType.nonRootComponentArrayTypeDataOrWxforItem
  | DiagnosticErrorType.mustacheSyntax
  | DiagnosticErrorType.invalidExpression
  | DiagnosticErrorType.illegalOperator
  | DiagnosticErrorType.ternaryValueQuantity
  | DiagnosticErrorType.invalidUpperValue
  | DiagnosticErrorType.duplicateAttr
  | DiagnosticErrorType.duplicateId
  | DiagnosticErrorType.nonWxforItemVariable
  | DiagnosticErrorType.invalidTernaryExpression
  | CommentErrorMessage
  | DiagnosticErrorType.invalidTernaryValue
  | DiagnosticErrorType.notFoundMustacheSyntax
  | DiagnosticErrorType.syntaxError
  | DiagnosticErrorType.illegalExpression
  | DiagnosticErrorType.repeatedSubComponentTag
  | DiagnosticErrorType.unknownImport
  | DiagnosticErrorType.errorImportPath
  | DiagnosticErrorType.usingComponents
  | DiagnosticErrorType.unknownProperty;

export enum DiagnosticErrorType {
  singleMustacheSyntaxConstraint = "只能有一个{{}}",
  syntaxError = "语法错误",
  repeatedSubComponentTag = "重复的子组件",
  shouldWxForItemOrSubCompData = "应该是wx:for-item或对应子组件的数据",
  notWxForItemValue = "不是wx:for-item的值",
  notWxForOrRootValues = "不是wx:for-item或wx:for-index或rootComponent的值",
  shouldWxForOrRootArrayTypeData = "应该是wx:for或根组件中数组类型数据",
  shouldWxForOrRootBooleanTypeData = "应该是wx:for或根组件中布尔类型数据",
  invalidExpression = "无效的表达式",
  duplicateId = "重复的id",
  notRootData = "不是根组件中的值",
  invalidVariable = "无效的变量",
  errorImportPath = "错误的导入路径",
  invalidTernaryExpression = "无效的三元表达式",
  invalidTernaryValue = "无效的三元表达式值",
  ternaryValueQuantity = "三元表达式值的数量错误",
  unknownTag = "未知标签",
  repeatedWxForItem = "wx:for-item与上层定义重复",
  repeatedWxForIndex = "wx:for-index与上层定义重复",
  repeatedWxForItemDefault = "默认wx:for-item与上层定义重复",
  repeatedWxForIndexDefault = "默认wx:for-index与上层定义重复",
  nonArrType = "非数组类型",
  conditionalAttrExisted = "已有条件属性",
  missPrerequisite = "缺少先决条件",
  withoutValue = "不可无值",
  missingComopnent = "缺少组件",
  missingAttr = "缺少属性",
  errorValue = "错误的值",
  valueShouldNotExist = "不应有值",
  missingWxfor = "缺少wx:for属性",
  missingWxkey = "缺少wx:key属性",
  notMatchWithWxFor = "与wxFor不匹配",
  nonSubComponentOrWxforVariable = "非对应子组件或wx:for定义的变量",
  nonRootComponentDataOrWxforVariable = "非根组件或wx:for定义的变量",
  nonRootComponentArrayTypeDataOrWxforItem = "非根组件数组类型或wx:for-item变量",
  nonWxforItemVariable = "非wx:for-item变量",
  invalidEvent = "无效事件",
  illegalOperator = "非法的运算符",
  illegalExpression = "非法的表达式",
  invalidValue = "无效值",
  invalidUpperValue = "应是上层wxFor-item/wxFor-index的值或子字段的值",
  duplicateAttr = "重复的属性",
  unknownAttr = "未知的属性",
  mustacheSyntax = "不符合'{{}}'语法",
  notFoundMustacheSyntax = "未发现{{}}语法 ",
  usingComponents = "usingComponents不符合预期",
  unknownProperty = "未知配置属性",
  missingImport = " 缺少导入的组件",
  unknownImport = "未知的导入",
  commentTextError = "注释内容错误",
  invalidCommentLocation = "注释应写在文件头部",
  repeatedComment = "重复的注释",
  shouldEndComment = "没有结束注释",
  noStartedComment = "还没有开始注释不可结束",
  emptyBlockTag = "空的block标签",
  shouldNotHaveValue = "shouldNotHaveValue",
}
