import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";
suite("mustacheValues", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mustacheValues.wxml");
  const duplicateId = DiagnosticErrorType.duplicateId;
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    duplicateId,
    duplicateId,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    duplicateId,
    duplicateId,
  ], "修复后验证");
});
