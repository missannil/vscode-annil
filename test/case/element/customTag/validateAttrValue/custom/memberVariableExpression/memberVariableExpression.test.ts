import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("memberVariableExpression", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/memberVariableExpression.wxml");
  const invalidExpression = DiagnosticErrorType.invalidExpression;

  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    invalidExpression,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    invalidExpression,
  ], "修复后");
});
