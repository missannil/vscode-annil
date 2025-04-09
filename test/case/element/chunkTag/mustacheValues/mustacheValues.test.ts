import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";
suite("mustacheValues", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mustacheValues.wxml");

  const invalidValue = DiagnosticErrorType.invalidValue;
  await assertErrorMessages(wxmlUri, [
    invalidValue,
    invalidValue,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    invalidValue,
    invalidValue,
  ], "修复后验证");
});
