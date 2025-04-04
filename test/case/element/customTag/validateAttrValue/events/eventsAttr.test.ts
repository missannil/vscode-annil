import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../start";
import { assertErrorMessages } from "../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../tools/fixDiagnostic";

suite("eventsAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/eventsAttr.wxml");

  const errMsg = DiagnosticErrorType.errorValue;
  await assertErrorMessages(wxmlUri, [
    errMsg,
    errMsg,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, []);
});
