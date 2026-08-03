import { vscode } from "#deps";
import { BlockAttributeDiagnosticCode } from "../core/wxmlValidator/element/validateBlockAttributes.js";

/** 为 block 的未知属性提供移除 Quick Fix。 */
export function generateBlockCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code !== BlockAttributeDiagnosticCode) return [];

  const attributeName = document.getText(diagnostic.range);
  if (attributeName.length === 0) return [];

  const action = new vscode.CodeAction(
    `移除未知属性 “${attributeName}”`,
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  action.edit.delete(document.uri, getAttributeRemovalRange(document, diagnostic.range));

  return [action];
}

/** 移除属性名及其可选值，同时尽量保留 opening tag 的格式。 */
// eslint-disable-next-line complexity -- 需要同时处理带值属性和多行 opening tag
function getAttributeRemovalRange(
  document: vscode.TextDocument,
  attributeRange: vscode.Range,
): vscode.Range {
  const startOffset = document.offsetAt(attributeRange.start);
  let endOffset = document.offsetAt(attributeRange.end);
  const text = document.getText();

  let cursor = endOffset;
  while (cursor < text.length && /[ \t]/.test(text[cursor])) cursor++;
  if (text[cursor] === "=") {
    cursor++;
    while (cursor < text.length && /[ \t]/.test(text[cursor])) cursor++;

    const quote = text[cursor];
    if (quote === "\"" || quote === "'") {
      cursor++;
      while (cursor < text.length && text[cursor] !== quote) cursor++;
      if (cursor < text.length) cursor++;
    } else {
      while (cursor < text.length && !/[ \t\r\n>]/.test(text[cursor])) cursor++;
    }
    endOffset = cursor;
  }

  let removalStart = startOffset;
  if (removalStart > 0 && /[ \t]/.test(text[removalStart - 1])) removalStart--;

  const lineStart = text.lastIndexOf("\n", startOffset - 1) + 1;
  const lineEnd = text.indexOf("\n", endOffset);
  const endOfLine = lineEnd === -1 ? text.length : lineEnd;
  if (/^[ \t]*$/.test(text.slice(lineStart, removalStart)) && /^[ \t]*$/.test(text.slice(endOffset, endOfLine))) {
    removalStart = lineStart;
    endOffset = lineEnd === -1 ? endOfLine : lineEnd + 1;
  }

  return new vscode.Range(document.positionAt(removalStart), document.positionAt(endOffset));
}
