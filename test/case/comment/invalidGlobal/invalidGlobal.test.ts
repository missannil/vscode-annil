import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";

suite("invalidGlobal", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/invalidGlobal.wxml");

  const invalidGlobal = DiagnosticErrorType.invalidCommentLocation;

  await assertErrorMessages(wxmlUri, [invalidGlobal]);
});
// <view class>
// 	<view></view>
// 	<!--  annil disable all  -->
// </view>
