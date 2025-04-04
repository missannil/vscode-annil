import { DefineComponent } from "annil";
import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../start";
import { assertErrorMessages } from "../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../tools/fixDiagnostic";
suite("withoutValue", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/withoutValue.wxml");

  const withoutValue = DiagnosticErrorType.withoutValue;
  await assertErrorMessages(wxmlUri, [
    withoutValue,
    withoutValue,
    withoutValue,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, []);
});
