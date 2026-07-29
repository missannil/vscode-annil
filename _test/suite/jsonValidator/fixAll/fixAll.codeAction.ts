import { commands, type Diagnostic, type Uri } from "vscode";
import { waitForDiagnosticUpdate } from "../../wxmlValidator/diagnosticHelper.js";

/** 执行组件级 annil.fix-all，并等待下一份 JSON 诊断快照。 */
export async function applyJsonFixAll(
  uri: Uri,
  predicate: (diagnostics: readonly Diagnostic[]) => boolean,
): Promise<readonly Diagnostic[]> {
  const diagnosticsReady = waitForDiagnosticUpdate(uri, predicate);
  await commands.executeCommand("annil.fix-all");

  return diagnosticsReady;
}
