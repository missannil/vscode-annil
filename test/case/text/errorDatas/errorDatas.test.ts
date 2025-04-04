import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";

suite("errorDatas", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/errorDatas.wxml");

  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    invalidExpression,
    nonSubComponentOrWxforVariable,
  ]);
});
