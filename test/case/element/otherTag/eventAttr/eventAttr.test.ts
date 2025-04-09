import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("eventAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/eventAttr.wxml");

  const invalidEvent = DiagnosticErrorType.invalidEvent;
  await assertErrorMessages(wxmlUri, [invalidEvent, invalidEvent, invalidEvent]);
});
