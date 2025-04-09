import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";
suite("mustacheVariable", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mustacheVariable.wxml");

  const invalidValue = DiagnosticErrorType.invalidValue;
  await assertErrorMessages(wxmlUri, [invalidValue]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [invalidValue]);
});
