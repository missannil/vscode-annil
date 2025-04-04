import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("outSideChunk", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/outSideChunk.wxml");

  await assertErrorMessages(wxmlUri, [DiagnosticErrorType.duplicateId]);
});
