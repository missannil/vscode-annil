import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";

suite("missingWxforAndWxkey", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/missingWxforAndWxkey.wxml");
  const missingWxfor = DiagnosticErrorType.missingWxfor;
  const missingWxkey = DiagnosticErrorType.missingWxkey;
  await assertErrorMessages(wxmlUri, [missingWxfor, missingWxkey]);
  await fixAll(wxmlUri);
  const invalidVariable = DiagnosticErrorType.invalidVariable;
  await assertErrorMessages(wxmlUri, [
    DiagnosticErrorType.invalidExpression,
    invalidVariable,
  ]);
});

// <!-- 需要必要的wx:for属性 -->
// <block
// 	wx:for-item="item"
// 	wx:for-index="index"
// ></block>
// <!-- 正确的 -->
// <block
// 	wx:for="{{arr}}"
// 	wx:for-item="item"
// 	wx:for-index="index"
// ></block>
