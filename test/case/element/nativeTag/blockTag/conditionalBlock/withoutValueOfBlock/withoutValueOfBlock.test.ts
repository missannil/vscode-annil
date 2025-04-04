import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("withoutValueOfBlock", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/withoutValueOfBlock.wxml");

  const withoutValue = DiagnosticErrorType.withoutValue;
  await assertErrorMessages(wxmlUri, [
    withoutValue,
    withoutValue,
    withoutValue,
  ]);
  await fixAll(wxmlUri);
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  await assertErrorMessages(wxmlUri, [
    invalidExpression,
    invalidExpression,
    invalidExpression,
  ]);
});
