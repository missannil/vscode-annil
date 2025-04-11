import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";
suite("ignoreAttr", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/ignoreAttr.wxml");
  const invalidValue = DiagnosticErrorType.invalidValue;
  await assertErrorMessages(wxmlUri, [invalidValue, invalidValue]);
});

/**
 *
 *
<view
  id="chunk"
  data-id="{{xxx}}"
  compId="{{xxx}}"
  class="ddd"
>{{num}}</view>

 */
