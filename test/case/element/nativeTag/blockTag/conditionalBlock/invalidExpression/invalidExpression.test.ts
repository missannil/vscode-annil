import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixDiagnostic } from "../../../../../../tools/fixDiagnostic";

// suite("invalidExpression", async () => {
//   const wxmlUri = vscode.Uri.file(__dirname + "/invalidExpression.wxml");

//   const errMsg = DiagnosticErrorType.invalidExpression;
//   await assertErrorMessages(wxmlUri, [
//     errMsg,
//     errMsg,
//     errMsg,
//   ]);
//   await fixDiagnostic(wxmlUri, 0, 0);

//   await assertErrorMessages(wxmlUri, []);
// });
