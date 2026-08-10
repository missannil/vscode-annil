import { vscode } from "#deps";
import { CustomComponentDiagnosticCode } from "../core/wxmlValidator/customComponent/validateCustomComponent.js";
import { positionAt, readOpeningTag } from "../core/wxmlValidator/element/openingTag.js";

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

/**
 * 在诊断所在行开始的 opening tag（可能跨行）中定位整个属性（名 + 值）。
 *
 * 用后瞻 `(?<=\s)` 替代 `\s` 前缀：属性名前不留空白字符（删除范围更干净），
 * 且对 `-` 开头等非单词字符开头的属性名同样有效。
 */
function getAttributeRange(
  document: vscode.TextDocument,
  line: number,
  name: string,
): vscode.Range | undefined {
  const textlines = document.getText().split("\n");
  const openingTag = readOpeningTag(textlines, line);
  const pattern = new RegExp(`(?<=\\s)${escapeRegExp(name)}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'))?`);
  const match = pattern.exec(openingTag.text);
  if (match?.index === undefined) return undefined;

  const start = positionAt(textlines, openingTag.startOffset + match.index);
  const end = positionAt(textlines, openingTag.startOffset + match.index + match[0].length);

  return new vscode.Range(start, end);
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
    const closePosition = findOpeningTagClosePosition(document, diagnostic.range.start.line);
    if (closePosition === undefined) return [];
    action.edit?.insert(document.uri, closePosition, ` ${replaceText}`);

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

/** 查找从诊断所在行开始的 opening tag 属性插入位置，支持多行属性和引号内的 `>`。 */
function findOpeningTagClosePosition(
  document: vscode.TextDocument,
  startLine: number,
): vscode.Position | undefined {
  const fullText = document.getText();
  const startOffset = document.offsetAt(new vscode.Position(startLine, 0));
  let quote: string | undefined;

  for (let offset = startOffset; offset < fullText.length; offset++) {
    const current = fullText[offset];
    if (quote !== undefined) {
      if (current === quote) quote = undefined;
    } else if (current === "\"" || current === "'") {
      quote = current;
    } else if (current === ">") {
      return getAttributeInsertPosition(document, fullText, offset);
    }
  }

  return undefined;
}

/**
 * 属性必须插在标签结束标记之前：自闭合 `/>` 时插在 `/` 前，
 * 否则插在 `>` 前，避免生成 `<xxx / attr="...">` 的错误代码。
 */
function getAttributeInsertPosition(
  document: vscode.TextDocument,
  fullText: string,
  closeOffset: number,
): vscode.Position {
  let offset = closeOffset - 1;
  while (offset >= 0 && /\s/.test(fullText[offset] ?? "")) offset--;
  const insertOffset = fullText[offset] === "/" ? offset : closeOffset;

  return document.positionAt(insertOffset);
}
