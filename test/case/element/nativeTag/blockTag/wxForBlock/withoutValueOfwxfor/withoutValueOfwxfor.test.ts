import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("withoutValueOfwxfor", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/withoutValueOfwxfor.wxml");

  const withoutValue = DiagnosticErrorType.withoutValue;
  await assertErrorMessages(wxmlUri, [
    withoutValue,
    withoutValue,
    withoutValue,
    withoutValue,
  ]);
  await fixAll(wxmlUri);
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  const invalidVariable = DiagnosticErrorType.invalidVariable;

  await assertErrorMessages(wxmlUri, [
    invalidExpression,
    invalidVariable,
    invalidVariable,
    invalidVariable,
  ]);
});
