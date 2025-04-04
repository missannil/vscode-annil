import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
import { fixAll } from "../../../tools/fixDiagnostic";

suite("usingComponents.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/usingComponents.json");

  const usingComponents = DiagnosticErrorType.usingComponents;
  await assertErrorMessages(jsonUri, [
    usingComponents,
  ]);
  await fixAll(jsonUri);
  await assertErrorMessages(jsonUri, []);
});
