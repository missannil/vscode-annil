import { vscode } from "#deps";
import { ConditionDiagnosticCode } from "../core/wxmlValidator/element/condition/conditionDiagnostics.js";

/** 为带值的 wx:else 提供移除属性值的 Quick Fix。 */
export function generateConditionCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code === ConditionDiagnosticCode.missingValue) {
    const attributeName = document.getText(diagnostic.range);
    const action = new vscode.CodeAction(
      `补充 ${attributeName} 的值`,
      vscode.CodeActionKind.QuickFix,
    );
    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();
    action.edit.insert(document.uri, diagnostic.range.end, "=\"{{布尔表达式}}\"");

    return [action];
  }

  if (diagnostic.code !== ConditionDiagnosticCode.elseHasValue) return [];

  const attributeEnd = findAttributeEnd(document, diagnostic.range);
  if (attributeEnd === undefined) return [];

  const action = new vscode.CodeAction("移除 wx:else 的值", vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(
    document.uri,
    new vscode.Range(diagnostic.range.start, attributeEnd),
    "wx:else",
  );

  return [action];
}

// eslint-disable-next-line complexity -- 兼容引号和非引号属性值
function findAttributeEnd(
  document: vscode.TextDocument,
  range: vscode.Range,
): vscode.Position | undefined {
  const text = document.getText();
  const start = document.offsetAt(range.start);
  let offset = document.offsetAt(range.end);

  while (/\s/.test(text[offset] ?? "")) offset++;
  if (text[offset] !== "=") return undefined;
  offset++;
  while (/\s/.test(text[offset] ?? "")) offset++;

  const quote = text[offset];
  if (quote === "\"" || quote === "'") {
    offset++;
    while (offset < text.length && text[offset] !== quote) offset++;
    if (offset < text.length) offset++;

    return document.positionAt(offset);
  }

  while (offset < text.length && !/[\s>]/.test(text[offset])) offset++;

  return offset > start ? document.positionAt(offset) : undefined;
}
