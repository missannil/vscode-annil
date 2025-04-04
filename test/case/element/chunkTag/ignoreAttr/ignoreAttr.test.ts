import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("ignoreAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/ignoreAttr.wxml");

  await assertErrorMessages(wxmlUri, [DiagnosticErrorType.duplicateId]);
});
