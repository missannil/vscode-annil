import { vscode } from "#deps";
import { WxForDiagnosticCode } from "../core/wxmlValidator/element/validateWxForStructure.js";

function createAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
  title: string,
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();

  return action;
}

/** 为 block 循环缺少的必要属性提供 Quick Fix。 */
export function generateWxForCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code !== WxForDiagnosticCode.missingFor && diagnostic.code !== WxForDiagnosticCode.missingKey) {
    return [];
  }

  const isWxFor = diagnostic.code === WxForDiagnosticCode.missingFor;
  const attribute = isWxFor ? "wx:for" : "wx:key";
  const value = isWxFor ? "{{数组类型变量名}}" : "*this";
  const action = createAction(document, diagnostic, `添加属性 “${attribute}”`);
  const insertPosition = findOpeningTagEnd(document, diagnostic.range.start);
  if (insertPosition === undefined) return [];

  action.edit?.insert(document.uri, insertPosition, ` ${attribute}="${value}"`);

  return [action];
}

function findOpeningTagEnd(
  document: vscode.TextDocument,
  start: vscode.Position,
): vscode.Position | undefined {
  const text = document.getText();
  let quote: string | undefined;

  for (let offset = document.offsetAt(start); offset < text.length; offset++) {
    const char = text[offset];
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
    } else if (char === "\"" || char === "'") {
      quote = char;
    } else if (char === ">") {
      return document.positionAt(offset);
    }
  }

  return undefined;
}
