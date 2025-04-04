import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("missPrerequisite", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/missPrerequisite.wxml");

  const missPrerequisite = DiagnosticErrorType.missPrerequisite;
  await assertErrorMessages(wxmlUri, [
    missPrerequisite,
    missPrerequisite,
    missPrerequisite,
  ]);
});

// <!-- 判断 wx:elif 和 wx:else 是否缺少先决条件(前面存在wx:if或elif) -->
// <block wx:if="{{bool}}"></block>
// <!-- elif 前面有wx:if 正常 -->
// <block wx:elif="{{bool}}" />
// <!-- elif 前面有wx:elif 正常 -->
// <block wx:elif="{{bool}}" />
// <!-- else 前面有wx:elif 正常 -->
// <block wx:else></block>

// <block wx:if="{{bool}}"></block>
// <!-- else 前面有wx:if 正常 -->
// <block wx:else></block>
// <!-- elif 前面没有wx:if或elif报错 1 -->
// <block wx:elif="bool"></block>
// <!-- else 前面有elif,虽然是错误,但不应该报错 -->
// <block wx:else></block>

// <view class>
// 	<block wx:if="{{bool}}"></block>
// 	<!-- elif 前面有wx:if 正常 -->
// 	<block wx:elif="{{bool}}" />
// 	<!-- elif 前面有wx:elif 正常 -->
// 	<block wx:elif="{{bool}}" />
// 	<!-- else 前面有wx:elif 正常 -->
// 	<block wx:else></block>

// 	<block wx:if="{{bool}}"></block>
// 	<!-- else 前面有wx:if 正常 -->
// 	<block wx:else></block>

// 	<!-- else 前面没有wx:if或elif报错 2 -->
// 	<block wx:else></block>

// 	<!-- elif 前面没有wx:if或elif报错 3 -->
// 	<block wx:elif="{{bool}}"></block>
// </view>
