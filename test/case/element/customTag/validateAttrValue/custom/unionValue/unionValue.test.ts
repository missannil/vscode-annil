import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("unionValue", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/unionValue.wxml");
  const invalidVariable = DiagnosticErrorType.invalidVariable;
  await assertErrorMessages(wxmlUri, [
    invalidVariable,
    invalidVariable,
    invalidVariable,
    invalidVariable,
    invalidVariable,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    invalidVariable,
  ], "修复后");
});
