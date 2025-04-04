import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";

suite("textError", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/textError.wxml");

  const textError = DiagnosticErrorType.commentTextError;
  await assertErrorMessages(wxmlUri, [textError, textError, textError, textError, textError]);
});

// <!-- annil disable all 1-->
// <view class>
// 	<!-- annil disable line2   -->
// 	<!-- annil disable line  -->
// 	<view></view>
// 	<!-- annil disable start 3 -->
// 	<!-- annil disable start  -->
// 	<view></view>
// 	<!-- annil disable end 4-->
// 	<!-- annil disable end -->
// 	<!-- annil disable repeatTag 5-->
// 	<!-- annil disable repeatTag-->
// </view>
