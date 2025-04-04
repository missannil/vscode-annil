import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixDiagnostic } from "../../../../tools/fixDiagnostic";

// suite("standbyWxifvalue", async () => {
//   const wxmlUri = vscode.Uri.file(__dirname + "/standbyWxifvalue.wxml");

//   const errMsg = DiagnosticErrorType.duplicateAttr;
//   await assertErrorMessages(wxmlUri, [errMsg, errMsg]);
//   await fixDiagnostic(wxmlUri, 0, 0);
//   await fixDiagnostic(wxmlUri, 0, 0);
//   await assertErrorMessages(wxmlUri, []);
// });
// <subA
// 	numAA="{{subA_numAA}}"
// 	num-aA
// 	numA-a="any"
// />
