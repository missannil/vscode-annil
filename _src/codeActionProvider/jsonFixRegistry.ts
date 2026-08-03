import { vscode } from "#deps";
import { JsonDiagnosticCode } from "../core/jsonValidator/diagnosticCodes.js";
import {
  generateInvalidPathCodeAction,
  generateMissingImportCodeAction,
  generateMissingPlaceholderCodeAction,
  generateUnknownConfigKeyCodeAction,
  generateUnknownImportCodeAction,
  generateUnknownPlaceholderCodeAction,
} from "./jsonFix.js";

type JsonFixGenerator = (
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
) => vscode.CodeAction | undefined;

const jsonFixGenerators: ReadonlyMap<string, JsonFixGenerator> = new Map([
  [JsonDiagnosticCode.unknownImport, generateUnknownImportCodeAction],
  [JsonDiagnosticCode.missingImport, generateMissingImportCodeAction],
  [JsonDiagnosticCode.unknownPlaceholder, generateUnknownPlaceholderCodeAction],
  [JsonDiagnosticCode.missingPlaceholder, generateMissingPlaceholderCodeAction],
  [JsonDiagnosticCode.invalidPath, generateInvalidPathCodeAction],
  [JsonDiagnosticCode.unknownConfigKey, generateUnknownConfigKeyCodeAction],
]);

/** 根据稳定 JSON 诊断代码生成对应的单项修复。 */
export function generateRegisteredJsonFixes(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (typeof diagnostic.code !== "string") return [];

  const action = jsonFixGenerators.get(diagnostic.code)?.(document, diagnostic);

  return action === undefined ? [] : [action];
}
