import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../../start";
import { assertErrorMessages } from "../../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../../tools/fixDiagnostic";

suite("withCustomComp", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/withCustomComp.wxml");

  const invalidTernaryExpression = DiagnosticErrorType.invalidTernaryExpression;
  const invalidVariable = DiagnosticErrorType.invalidVariable;
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;

  await assertErrorMessages(wxmlUri, [
    // 三元表达式错误
    invalidTernaryExpression,
    invalidExpression,
    invalidVariable,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    // 非三元表达式错误
    invalidExpression,
    DiagnosticErrorType.illegalOperator,
    nonSubComponentOrWxforVariable,
  ]);

  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    // 三元表达式错误
    invalidTernaryExpression,
    invalidExpression,
    invalidVariable,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    invalidExpression,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    // 非三元表达式错误
    invalidExpression,
    DiagnosticErrorType.illegalOperator,
    nonSubComponentOrWxforVariable,
  ], "修复后");
});
