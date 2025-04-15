import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("unknownPlaceholder.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/unknownPlaceholder.json");

  const unknownPlaceholder = DiagnosticErrorType.unknownPlaceholder;
  await assertErrorMessages(jsonUri, [
    unknownPlaceholder,
    unknownPlaceholder,
    unknownPlaceholder,
  ]);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
