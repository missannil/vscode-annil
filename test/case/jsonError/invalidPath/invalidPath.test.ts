import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("invalidPath.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/invalidPath.json");

  const invalidPath = DiagnosticErrorType.invalidPath;
  await assertErrorMessages(jsonUri, [
    invalidPath,
    invalidPath,
    invalidPath,
  ]);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
