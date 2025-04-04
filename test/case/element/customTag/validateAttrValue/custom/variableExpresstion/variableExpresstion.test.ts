import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("variableExpresstion", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/variableExpresstion.wxml");
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
  ]);
});
