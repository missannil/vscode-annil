import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
suite("repeatedComment", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/repeatedComment.wxml");

  const repeatedComment = DiagnosticErrorType.repeatedComment;
  await assertErrorMessages(wxmlUri, [
    repeatedComment,
    repeatedComment,
    repeatedComment,
    repeatedComment,
    repeatedComment,
    repeatedComment,
  ]);
});

// <!-- 同级注释会出现重复错误，同级节点检测完毕后会把注释状态变为none -->

// <view class>
// <!-- annil disable start -->
// <view></view>
// <!-- annil disable start -->
// <!-- annil disable line -->
// <view></view>
// <!-- annil disable line -->
// </view
// <view class>
// <!-- annil disable line -->
// <!-- annil disable start -->
// <view></view>
// <!-- annil disable line -->
// <!-- annil disable line -->
// <view></view>
// </view>
// <view class>
// <!-- annil disable repeatTag -->
// <!-- annil disable repeatTag -->
// <view></view>
// </view>
