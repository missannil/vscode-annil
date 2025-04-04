import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
suite("unknownTag", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/unknownTag.wxml");

  const unknownTagMsg = DiagnosticErrorType.unknownTag;
  await assertErrorMessages(wxmlUri, [unknownTagMsg]);
});
