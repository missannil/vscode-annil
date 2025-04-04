import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";
suite("variableValidity", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/variableValidity.wxml");

  const errorValue = DiagnosticErrorType.errorValue;
  await assertErrorMessages(wxmlUri, [
    errorValue,
    errorValue,
    errorValue,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, []);
});
