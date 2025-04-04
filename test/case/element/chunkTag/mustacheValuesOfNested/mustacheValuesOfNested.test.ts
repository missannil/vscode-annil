import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";
suite("mustacheValuesOfNested", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mustacheValuesOfNested.wxml");
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  const duplicateId = DiagnosticErrorType.duplicateId;
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    duplicateId,
    duplicateId,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    nonSubComponentOrWxforVariable,
    duplicateId,
    duplicateId,
  ]);
});
