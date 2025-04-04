import * as vscode from "vscode";
import { type WxmlUri } from "../../componentManager/uriHelper";
import { assertNonNullable } from "../../utils/assertNonNullable";

import {
  type DiagnosticMessage,
  isCommentErrorMsg,
  isConditionalAttrExistedMsg,
  isDuplicateAttrMsg,
  isEmptyBlockTagMsg,
  isErrorValueMsg,
  isInvalidTernaryExpressionMsg,
  isInvalidTernaryValueMsg,
  isInvalidVariableMsg,
  isMissingAttrMsg,
  isMissingWxfor,
  isMissingWxkeyMsg,
  isMustacheSyntaxMsg,
  isNonRootComponentDataOrWxforVariableMsg,
  isNonSubComponentOrWxforVariableMsg,
  isNotFoundMustacheSyntaxMsg,
  isNotWxForItemValueMsg,
  isRepeatedWxForIndexDefaultMsg,
  isRepeatedWxForItemDefaultMsg,
  isSingleMustacheSyntaxConstraintMsg,
  isTernaryValueQuantityMsg,
  isUnknownAttrMsg,
  isValueShouldNotExistMsg,
  isWithoutValueMsg,
} from "../errorType";
import { generateCommentCodeActions } from "./commentErrorHandler";
import { editDelete } from "./editHandle/delete";
import { editReplace } from "./editHandle/editReplce";
import { editInsert } from "./editHandle/insert";

// eslint-disable-next-line complexity
export function generateCodeActionOfWxml(
  wxmlUri: WxmlUri,
  diagnostic: vscode.Diagnostic,
  // 未传入codeAction时,会根据诊断错误类型生成一个codeAction并编辑修复程序(单错误修复),传入时则直接编辑修复程序(用于修复全部)
  codeAction?: vscode.CodeAction,
): vscode.CodeAction[] {
  // 在生成诊断时,已将错误类型存储在诊断的message属性中
  const errMsg = diagnostic.message as DiagnosticMessage;
  if (
    isDuplicateAttrMsg(errMsg) || isUnknownAttrMsg(errMsg) || isConditionalAttrExistedMsg(errMsg)
  ) {
    return [editDelete(wxmlUri, diagnostic, codeAction)];
  }

  if (isMissingAttrMsg(errMsg)) {
    return [
      editInsert(wxmlUri, diagnostic, errMsg.split(":")[1], assertNonNullable(diagnostic.info.fixCode), codeAction),
    ];
  }
  if (isMissingWxkeyMsg(errMsg)) {
    return [editInsert(wxmlUri, diagnostic, "wx:key", " wx:key=\"自定义wxkey\"", codeAction)];
  }
  if (isMissingWxfor(errMsg)) {
    return [editInsert(wxmlUri, diagnostic, "wx:for", " wx:for=\"{{数组类型变量名}}\"", codeAction)];
  }
  if (isRepeatedWxForIndexDefaultMsg(errMsg)) {
    return [editInsert(wxmlUri, diagnostic, "wx:for-index", " wx:for-index=\"自定义index\"", codeAction)];
  }
  if (isRepeatedWxForItemDefaultMsg(errMsg)) {
    return [editInsert(wxmlUri, diagnostic, "wx:for-item", " wx:for-item=\"自定义item\"", codeAction)];
  }
  if (isEmptyBlockTagMsg(errMsg)) {
    const conditionState = diagnostic.info.conditionState;
    switch (conditionState) {
      case null:
        return [editInsert(wxmlUri, diagnostic, "wx:if", " wx:if=\"{{布尔表达式}}\"", codeAction)];
      case "wx:if":
        return [editInsert(wxmlUri, diagnostic, "wx:elif", " wx:elif=\"{{布尔表达式}}\"", codeAction)];
      case "wx:elif":
        return [editInsert(wxmlUri, diagnostic, "wx:else", " wx:else", codeAction)];
    }
  }
  if (
    // || isCustomValueMsg(errMsg)
    isWithoutValueMsg(errMsg) || isErrorValueMsg(errMsg) || isMustacheSyntaxMsg(errMsg)
    || isValueShouldNotExistMsg(errMsg) || isInvalidTernaryExpressionMsg(errMsg) || isTernaryValueQuantityMsg(errMsg)
    || isInvalidTernaryValueMsg(errMsg) || isNotWxForItemValueMsg(errMsg) || isInvalidVariableMsg(errMsg)
    || isNonSubComponentOrWxforVariableMsg(errMsg) || isNonRootComponentDataOrWxforVariableMsg(errMsg)
    || isSingleMustacheSyntaxConstraintMsg(errMsg) || isNotFoundMustacheSyntaxMsg(errMsg)
  ) {
    const replaceCode = diagnostic.info.replaceCode;

    return replaceCode !== "" && replaceCode !== undefined ? [editReplace(wxmlUri, diagnostic, codeAction)] : [];
  }
  if (isCommentErrorMsg(errMsg)) {
    return generateCommentCodeActions(wxmlUri, diagnostic, errMsg);
  }

  return [];
  // console.log("未找到对应的修复程序", diagnosticMessage);
}

export function generateFixAllActionOfWxml(
  wxmlUri: WxmlUri,
  diagnosticList: readonly vscode.Diagnostic[],
): vscode.CodeAction {
  const fixAllAction = new vscode.CodeAction(
    "修复全部",
    // vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.SourceFixAll,
  );
  // 都是对同一个文件进行编辑,所以只需要一个WorkspaceEdit实例
  fixAllAction.edit = new vscode.WorkspaceEdit();

  diagnosticList.forEach(diagnostic => generateCodeActionOfWxml(wxmlUri, diagnostic, fixAllAction));

  return fixAllAction;
}
// ask 在使用快捷键修复全部错误的诊断时，vscode允许我们给它一个action数组，它会依次运行这个数组的action么
// answer
//  不，VS Code 不会自动依次执行数组中的所有 CodeAction。
// 当你的扩展返回一个 CodeAction 数组时，VS Code 的行为是：
// 当用户通过快捷键触发 Code Action 时：
// 如果数组只有一个元素，VS Code 会直接执行它
// 如果数组有多个元素，VS Code 会显示一个选择菜单，让用户选择要执行的具体 Action
// VS Code 从不会 自动依次执行数组中的多个 Action，而是要求用户明确选择一个
