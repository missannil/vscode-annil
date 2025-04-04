import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("repeatCustomTag", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/repeatCustomTag.wxml");
  const repeatedCustomTag = DiagnosticErrorType.repeatedSubComponentTag;
  await assertErrorMessages(wxmlUri, [repeatedCustomTag]);
});
