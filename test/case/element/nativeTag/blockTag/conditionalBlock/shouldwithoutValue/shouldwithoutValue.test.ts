import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("shouldwithoutValue", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/shouldwithoutValue.wxml");

  const valueShouldNotExist = DiagnosticErrorType.valueShouldNotExist;
  await assertErrorMessages(wxmlUri, [
    valueShouldNotExist,
    valueShouldNotExist,
  ]);
  await fixAll(wxmlUri);

  await assertErrorMessages(wxmlUri, []);
});
