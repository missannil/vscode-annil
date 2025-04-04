import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../start";
import { assertErrorMessages } from "../../../../../tools/assertErrorMessages";
import { fixDiagnostic } from "../../../../../tools/fixDiagnostic";

suite("unknwonAttrOfBlock", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/unknwonAttrOfBlock.wxml");
  const unknownAttr = DiagnosticErrorType.unknownAttr;
  await assertErrorMessages(wxmlUri, [unknownAttr]);
  await fixDiagnostic(wxmlUri, 0, 0);
  await assertErrorMessages(wxmlUri, [DiagnosticErrorType.emptyBlockTag]);
});
