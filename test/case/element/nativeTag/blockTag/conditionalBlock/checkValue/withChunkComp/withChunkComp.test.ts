import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../../start";
import { assertErrorMessages } from "../../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../../tools/fixDiagnostic";

suite("withChunkComp", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/withChunkComp.wxml");

  const invalidTernaryExpression = DiagnosticErrorType.invalidTernaryExpression;
  const invalidVariable = DiagnosticErrorType.invalidVariable;
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  const duplicateId = DiagnosticErrorType.duplicateId;
  await assertErrorMessages(wxmlUri, [
    duplicateId,
    // 三元表达式错误
    invalidTernaryExpression,
    duplicateId,
    invalidExpression,
    duplicateId,
    invalidVariable,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    duplicateId,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    // 非三元表达式错误
    duplicateId,
    duplicateId,
    invalidExpression,
    duplicateId,
    DiagnosticErrorType.illegalOperator,
    duplicateId,
    nonSubComponentOrWxforVariable,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    duplicateId,
    // 三元表达式错误
    invalidTernaryExpression,
    duplicateId,
    invalidExpression,
    duplicateId,
    invalidVariable,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    duplicateId,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    // 非三元表达式错误
    duplicateId,
    duplicateId,
    invalidExpression,
    duplicateId,
    DiagnosticErrorType.illegalOperator,
    duplicateId,
    nonSubComponentOrWxforVariable,
  ], "修复后");
});
