import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("unknownImports.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/unknownImports.json");

  const unknownImport = DiagnosticErrorType.unknownImport;
  await assertErrorMessages(jsonUri, [
    unknownImport,
  ]);
  await fixAll(jsonUri);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
