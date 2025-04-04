import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../tools/fixDiagnostic";

// suite("nativeElementAttrs", async () => {
//   const wxmlUri = vscode.Uri.file(__dirname + "/nativeElementAttrs.wxml");

//   const errMsg = DiagnosticErrorType.unknownAttr;
//   await assertErrorMessages(wxmlUri, [`${errMsg}:aaa`, `${errMsg}:bbb`, `${errMsg}:ccc`]);
//   await fixAll(wxmlUri);

//   await assertErrorMessages(wxmlUri, []);
// });
