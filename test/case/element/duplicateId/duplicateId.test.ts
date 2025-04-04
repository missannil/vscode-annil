import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
suite("duplicateId", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/duplicateId.wxml");

  const duplicateId = DiagnosticErrorType.duplicateId;
  await assertErrorMessages(wxmlUri, [duplicateId, duplicateId, duplicateId]);
});
