import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("outSideChunk", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/outSideChunk.wxml");
  const nonSubComponentOrWxforVariable = DiagnosticErrorType.nonSubComponentOrWxforVariable;
  await assertErrorMessages(wxmlUri, [nonSubComponentOrWxforVariable]);
});
/**
 *
<view
  id="chunk"
  class="ddd"
>{{outSideChunk}}</view>


 */
