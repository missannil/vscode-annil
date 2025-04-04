import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../start";
import { assertErrorMessages } from "../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../tools/fixDiagnostic";

suite("emptyBlock", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/emptyBlock.wxml");

  const errMsg = DiagnosticErrorType.emptyBlockTag;
  await assertErrorMessages(wxmlUri, [
    errMsg,
    errMsg,
    errMsg,
  ]);
  await fixAll(wxmlUri);
  const invalidExpression = DiagnosticErrorType.invalidExpression;
  await assertErrorMessages(wxmlUri, [invalidExpression, invalidExpression]);
});
// <block></block>

// <view class>
// 	<block wx:if="{{bool}}"></block>
// 	<block></block>
// </view>

// <view class>
// 	<block wx:if="{{bool}}"></block>
// 	<block wx:elif="{{bool}}"></block>
// 	<block></block>
// </view>
