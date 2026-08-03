import { vscode } from "#deps";
import { generateBlockCodeActions } from "./blockFix.js";
import { generateCommentCodeActions } from "./commentFix.js";
import { generateConditionCodeActions } from "./conditionFix.js";
import { generateCustomComponentCodeActions } from "./customComponentFix.js";
import { generateEventValueCodeActions } from "./eventFix.js";
import { generateWxForCodeActions } from "./wxForFix.js";

export type WxmlFixGenerator = (
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
) => vscode.CodeAction[];

/**
 * WXML 规则修复注册表。
 *
 * 每个生成器自行识别其稳定诊断 code 或消息契约；Provider 仅负责遍历注册表，
 * 新规则不再修改通用分发流程。
 */
const wxmlFixGenerators: readonly WxmlFixGenerator[] = [
  (document, diagnostic): vscode.CodeAction[] => generateCommentCodeActions(document.uri, diagnostic),
  generateBlockCodeActions,
  generateConditionCodeActions,
  generateEventValueCodeActionsForDocument,
  generateWxForCodeActions,
  generateCustomComponentCodeActions,
];

export function generateRegisteredWxmlFixes(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return wxmlFixGenerators.flatMap((generator) => generator(document, diagnostic));
}

function generateEventValueCodeActionsForDocument(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  return generateEventValueCodeActions(document.uri, diagnostic);
}
