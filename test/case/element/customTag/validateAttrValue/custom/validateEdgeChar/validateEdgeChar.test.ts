import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("validateEdgeChar", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/validateEdgeChar.wxml");
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    invalidExpression,
    invalidExpression,
    nonSubComponentOrWxforVariable,
    invalidExpression,
    invalidExpression,
  ]);
});
