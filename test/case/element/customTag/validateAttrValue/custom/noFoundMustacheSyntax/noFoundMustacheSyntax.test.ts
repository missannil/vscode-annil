import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";

suite("noFoundMustacheSyntax", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/noFoundMustacheSyntax.wxml");
  const notFoundMustacheSyntax = DiagnosticErrorType.notFoundMustacheSyntax;
  await assertErrorMessages(wxmlUri, [
    notFoundMustacheSyntax,
  ]);
});
