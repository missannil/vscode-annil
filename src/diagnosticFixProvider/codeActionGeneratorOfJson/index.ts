import * as vscode from "vscode";
import type { JsonUri } from "../../componentManager/uriHelper";
import { DiagnosticErrorType, DiagnosticMessage } from "../errorType";

function isUsingComponentMsg(errMsg: DiagnosticMessage): errMsg is DiagnosticErrorType.usingComponents {
  return errMsg === DiagnosticErrorType.usingComponents;
}

function generateReplaceUsingComponentsAction(
  jsonUri: JsonUri,
  jsonText: string,
  expectedUsingComponents: object,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  // 判断jsonText是否有usingComponents
  const config = JSON.parse(jsonText);
  config.usingComponents = expectedUsingComponents;
  codeAction = codeAction || new vscode.CodeAction(
    "修复usingComponents",
    vscode.CodeActionKind.QuickFix,
  );
  // 创建工作区编辑
  codeAction.edit = codeAction.edit || new vscode.WorkspaceEdit();

  // 获取文档的行数
  const textLines = jsonText.split("\n");
  const lastLineIndex = Math.max(0, textLines.length - 1);
  const lastLineLength = textLines[lastLineIndex].length;

  // 创建从文档开始到文档结束的范围
  const entireDocumentRange = new vscode.Range(
    0,
    0, // 文档开始 (第一行第一列)
    lastLineIndex,
    lastLineLength, // 文档结束 (最后一行最后一列)
  );

  // 替换整个文档内容
  codeAction.edit.replace(
    jsonUri,
    entireDocumentRange,
    JSON.stringify(config, null, 2),
  );

  return codeAction;
}

export function generateCodeActionOfJson(
  jsonUri: JsonUri,
  jsonText: string,
  diagnostic: vscode.Diagnostic,
  // 未传入codeAction时,会根据诊断错误类型生成一个codeAction并编辑修复程序(单错误修复),传入时则直接编辑修复程序(用于修复全部)
  codeAction?: vscode.CodeAction,
): vscode.CodeAction[] {
  const codeActionList: vscode.CodeAction[] = [];
  const errMsg = diagnostic.message as DiagnosticMessage;
  if (isUsingComponentMsg(errMsg)) {
    const expectedUsingComponents = JSON.parse(diagnostic.code as string);
    codeActionList.push(generateReplaceUsingComponentsAction(jsonUri, jsonText, expectedUsingComponents, codeAction));
  }

  return codeActionList;
}

export function generateFixAllActionOfJson(
  jsonUri: JsonUri,
  jsonText: string,
  diagnosticList: readonly vscode.Diagnostic[],
): vscode.CodeAction {
  const fixAllAction = new vscode.CodeAction(
    "修复全部",
    // vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.SourceFixAll,
  );
  // 都是对同一个文件进行编辑,所以只需要一个WorkspaceEdit实例
  fixAllAction.edit = new vscode.WorkspaceEdit();

  diagnosticList.forEach(diagnostic => generateCodeActionOfJson(jsonUri, jsonText, diagnostic, fixAllAction));

  return fixAllAction;
}
