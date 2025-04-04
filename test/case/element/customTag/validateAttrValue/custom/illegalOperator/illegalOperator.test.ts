import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("illegalOperator", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/illegalOperator.wxml");
  const illegalOperator = DiagnosticErrorType.illegalOperator;
  await assertErrorMessages(wxmlUri, [
    illegalOperator,
  ]);
});
