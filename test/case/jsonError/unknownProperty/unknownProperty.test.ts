import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../../../out/diagnosticFixProvider/errorType";
import { suite } from "../../../start";
import { assertErrorMessages } from "../../../tools/assertErrorMessages";
// import { fixAll } from "../../../tools/fixDiagnostic";

suite("unknownProperty.json", async () => {
  const jsonUri = vscode.Uri.file(__dirname + "/unknownProperty.json");

  const unknownProperty = DiagnosticErrorType.unknownProperty;
  await assertErrorMessages(jsonUri, [
    unknownProperty,
  ]);
});
