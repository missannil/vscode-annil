import * as vscode from "vscode";
import { suite } from "../../../../start";
import { assertErrorMessages } from "../../../../tools/assertErrorMessages";

suite("ignoreStartsWithData-", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/ignoreStartsWithData-.wxml");

  await assertErrorMessages(wxmlUri, []);
});
