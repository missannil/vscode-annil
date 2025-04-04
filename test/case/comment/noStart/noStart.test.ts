import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
suite("noStart", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/noStart.wxml");

  const nostart = DiagnosticErrorType.noStartedComment;
  await assertErrorMessages(wxmlUri, [nostart]);
});

// <view class>
// 	<!-- annil disable end-->
// 	<view></view>

// 	<view></view>
// </view>
