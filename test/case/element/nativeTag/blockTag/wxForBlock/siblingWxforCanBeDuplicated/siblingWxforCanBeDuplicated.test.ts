import * as vscode from "vscode";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("siblingWxforCanBeDuplicated", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/siblingWxforCanBeDuplicated.wxml");

  await assertErrorMessages(wxmlUri, []);
});
