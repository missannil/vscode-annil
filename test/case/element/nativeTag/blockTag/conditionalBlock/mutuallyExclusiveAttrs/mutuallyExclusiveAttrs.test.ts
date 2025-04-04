import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixDiagnostic } from "../../../../../../tools/fixDiagnostic";

suite("mutuallyExclusiveAttrs", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mutuallyExclusiveAttrs.wxml");

  const conditionalAttrExisted = DiagnosticErrorType.conditionalAttrExisted;
  await assertErrorMessages(wxmlUri, [conditionalAttrExisted, conditionalAttrExisted]);
  await fixDiagnostic(wxmlUri, 0, 0);
  await fixDiagnostic(wxmlUri, 0, 0);
  await assertErrorMessages(wxmlUri, []);
});

// <block
// 	wx:if="{{bool}}"
// 	wx:elif="{{bool}}"
// 	wx:else
// ></block>
