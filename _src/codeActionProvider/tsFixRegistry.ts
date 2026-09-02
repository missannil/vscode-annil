import { vscode } from "#deps";
import { UnusedDataDiagnosticCode } from "../core/tsAnalyzer/unusedDataAnalyzer.js";
import {
  generateSuggestInternalAction,
  generateUnusedDataDeleteAction,
  generateUnusedDataIgnoreAction,
} from "./tsFix.js";

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
  const ignoreAction = generateUnusedDataIgnoreAction(document, diagnostic);
  const actions: vscode.CodeAction[] = [];
  if (action !== undefined) actions.push(action);
  if (ignoreAction !== undefined) actions.push(ignoreAction);

  return actions;
}
