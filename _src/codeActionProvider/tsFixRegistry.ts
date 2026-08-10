import { vscode } from "#deps";
import { UnusedDataDiagnosticCode } from "../core/tsAnalyzer/unusedDataAnalyzer.js";
import { generateSuggestInternalAction, generateUnusedDataDeleteAction } from "./tsFix.js";

type TsFixGenerator = (
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
) => vscode.CodeAction | undefined;

const tsFixGenerators: ReadonlyMap<string, TsFixGenerator> = new Map([
  [UnusedDataDiagnosticCode.unusedData, generateUnusedDataDeleteAction],
  [UnusedDataDiagnosticCode.suggestInternal, generateSuggestInternalAction],
]);

export function generateRegisteredTsFixes(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (typeof diagnostic.code !== "string") return [];
  const action = tsFixGenerators.get(diagnostic.code)?.(document, diagnostic);

  return action === undefined ? [] : [action];
}
