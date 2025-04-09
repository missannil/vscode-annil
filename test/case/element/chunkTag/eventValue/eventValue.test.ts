import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";
suite("eventValue", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/eventValue.wxml");
  const invalidEvent = DiagnosticErrorType.invalidEvent;
  await assertErrorMessages(wxmlUri, [
    invalidEvent,
    invalidEvent,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    invalidEvent,
    invalidEvent,
  ], "修复后验证");
});
