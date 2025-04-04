// import { getDocumentText } from "tools/getDocumentText";
import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../../../../start";
import { assertErrorMessages } from "../../../../../../tools/assertErrorMessages";
import { fixAll } from "../../../../../../tools/fixDiagnostic";
suite("mustacheSyntaxOfCustomTag", async () => {
  const wxmlUri = vscode.Uri.file(__dirname + "/mustacheSyntaxOfCustomTag.wxml");

  const mustacheSyntax = DiagnosticErrorType.mustacheSyntax;
  await assertErrorMessages(wxmlUri, [
    mustacheSyntax,
    mustacheSyntax,
    mustacheSyntax,
  ]);
  await fixAll(wxmlUri);
  await assertErrorMessages(wxmlUri, []);
});
