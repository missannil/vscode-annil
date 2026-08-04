import { vscode } from "#deps";
import type { ConditionAttribute } from "./conditionAttributes.js";

export const ConditionDiagnosticCode = {
  mutuallyExclusive: "annil.condition.mutuallyExclusive",
  missingPrerequisite: "annil.condition.missingPrerequisite",
  elseHasValue: "annil.condition.elseHasValue",
  missingValue: "annil.condition.missingValue",
  mustacheSyntax: "annil.condition.mustacheSyntax",
  invalidExpression: "annil.condition.invalidExpression",
  nonBooleanValue: "annil.condition.nonBooleanValue",
  unknownValue: "annil.condition.unknownValue",
} as const;

export type ConditionDiagnosticCode = (typeof ConditionDiagnosticCode)[keyof typeof ConditionDiagnosticCode];

/** 创建具有稳定规则代码的条件属性诊断。 */
export function createConditionDiagnostic(
  attribute: ConditionAttribute,
  message: string,
  code: ConditionDiagnosticCode,
  range: vscode.Range | undefined = attribute.range,
): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
  diagnostic.source = "vscode-annil";
  diagnostic.code = code;

  return diagnostic;
}
