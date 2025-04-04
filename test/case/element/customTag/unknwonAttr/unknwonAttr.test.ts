import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";

suite("unknwonAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/unknwonAttr.wxml");

  const unknownAttr = DiagnosticErrorType.unknownAttr;
  const errorValue = DiagnosticErrorType.errorValue;
  await assertErrorMessages(wxmlUri, [
    unknownAttr,
    unknownAttr,
    unknownAttr,
    errorValue,
    DiagnosticErrorType.nonSubComponentOrWxforVariable,
    unknownAttr,
  ]);
  await fixAll(wxmlUri);

  await assertErrorMessages(wxmlUri, [
    DiagnosticErrorType.nonSubComponentOrWxforVariable,
  ]);
});
