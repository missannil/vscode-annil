import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("missingImports.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/missingImports.json");

  const missingImport = DiagnosticErrorType.missingImport;
  await assertErrorMessages(jsonUri, [
    missingImport,
    missingImport,
    missingImport,
  ]);
  await fixAll(jsonUri);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
