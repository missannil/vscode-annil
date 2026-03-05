import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";

suite("missingAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/missingAttr.wxml");

  const missingAttr = DiagnosticErrorType.missingAttr;
  await assertErrorMessages(wxmlUri, [
    missingAttr + ":numA" as DiagnosticErrorType.missingAttr,
    missingAttr + ":cid" as DiagnosticErrorType.missingAttr,
    missingAttr + ":userList" as DiagnosticErrorType.missingAttr,
    missingAttr + ":bind:eventA" as DiagnosticErrorType.missingAttr,
  ]);

  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, [DiagnosticErrorType.invalidExpression]);
});
