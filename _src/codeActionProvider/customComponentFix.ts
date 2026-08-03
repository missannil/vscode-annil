import { vscode } from "#deps";
import { CustomComponentDiagnosticCode } from "../core/wxmlValidator/customComponent/validateCustomComponent.js";

const MISSING_ATTRIBUTE_RE = /^缺少属性: "([^"]+)"$/;
const UNKNOWN_ATTRIBUTE_RE = /^未知属性: "([^"]+)"$/;
const EXACT_VALUE_RE = /^属性 "([^"]+)" 应绑定/;

function createAction(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  title: string,
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();

  return action;
}

function getInfo(diagnostic: vscode.Diagnostic): { replaceText?: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((diagnostic as any).info ?? {}) as { replaceText?: string };
}

function getAttributeRange(
  document: vscode.TextDocument,
  line: number,
  name: string,
): vscode.Range | undefined {
  const text = document.lineAt(line).text;
  const match = new RegExp(`\\s${escapeRegExp(name)}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'))?`).exec(text);
  if (match?.index === undefined) return undefined;

  return new vscode.Range(line, match.index, line, match.index + match[0].length);
}

function getAttributeValueRange(
  document: vscode.TextDocument,
  line: number,
  name: string,
): vscode.Range | undefined {
  const text = document.lineAt(line).text;
  const match = new RegExp(`${escapeRegExp(name)}\\s*=\\s*(["'])(.*?)\\1`).exec(text);
  if (match?.index === undefined || match[2] === undefined) return undefined;

  const valueStart = match.index + match[0].indexOf(match[2]);

  return new vscode.Range(line, valueStart, line, valueStart + match[2].length);
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// eslint-disable-next-line complexity -- 按稳定诊断 code 分派多种组件修复
export function generateCustomComponentCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  const missing = diagnostic.code === CustomComponentDiagnosticCode.missingAttribute
    ? MISSING_ATTRIBUTE_RE.exec(diagnostic.message)
    : null;
  if (missing !== null) {
    const replaceText = getInfo(diagnostic).replaceText;
    if (replaceText === undefined) return [];

    const action = createAction(document.uri, diagnostic, `添加属性 “${missing[1]}”`);
    const lineText = document.lineAt(diagnostic.range.start.line).text;
    const closeIndex = lineText.indexOf(">");
    if (closeIndex < 0) return [];
    action.edit?.insert(document.uri, new vscode.Position(diagnostic.range.start.line, closeIndex), ` ${replaceText}`);

    return [action];
  }

  const unknown = diagnostic.code === CustomComponentDiagnosticCode.unknownAttribute
    ? UNKNOWN_ATTRIBUTE_RE.exec(diagnostic.message)
    : null;
  if (unknown !== null) {
    const range = getAttributeRange(document, diagnostic.range.start.line, unknown[1]);
    if (range === undefined) return [];

    const action = createAction(document.uri, diagnostic, `移除未知属性 “${unknown[1]}”`);
    action.edit?.replace(document.uri, range, "");

    return [action];
  }

  const exact = diagnostic.code === CustomComponentDiagnosticCode.attributeValueMismatch
    ? EXACT_VALUE_RE.exec(diagnostic.message)
    : null;
  if (exact !== null) {
    const replaceText = getInfo(diagnostic).replaceText;
    const range = getAttributeValueRange(document, diagnostic.range.start.line, exact[1]);
    if (replaceText === undefined || range === undefined) return [];

    const action = createAction(document.uri, diagnostic, `修复属性 “${exact[1]}”`);
    action.edit?.replace(document.uri, range, replaceText);

    return [action];
  }

  return [];
}
