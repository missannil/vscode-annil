import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";

// suite("duplicateAttrs", async () => {
//   const wxmlUri = vscode.Uri.file(__dirname + "/duplicateAttrs.wxml");
//   const errMsg = DiagnosticErrorType.duplicateAttr;
//   await assertErrorMessages(wxmlUri, [errMsg, errMsg]);
//   await fixAll(wxmlUri);
//   await assertErrorMessages(wxmlUri, []);
// });
// <!-- wxml中支持属性使用中划线连接，与小驼峰效果相同，会照成重复属性 -->

// <subA
// 	numAA="{{subA_numAA}}"
// 	num-aA
// 	numA-a="any"
// />
