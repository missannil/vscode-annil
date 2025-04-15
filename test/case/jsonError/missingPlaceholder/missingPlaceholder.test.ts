import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("missingPlaceholder.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/missingPlaceholder.json");

  const missingPlaceholder = DiagnosticErrorType.missingPlaceholder;
  await assertErrorMessages(jsonUri, [
    missingPlaceholder,
    missingPlaceholder,
    missingPlaceholder,
  ]);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
