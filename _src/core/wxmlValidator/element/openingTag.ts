import { vscode } from "#deps";

export type OpeningTagSource = {
  text: string;
  startOffset: number;
};

/** 读取从元素起始行开始的 opening tag，忽略引号内的 `>`。 */
export function readOpeningTag(textlines: string[], startLine: number, nodeStartOffset?: number): OpeningTagSource {
  const lineStartOffset = textlines.slice(0, startLine).reduce((offset, line) => offset + line.length + 1, 0);
  const startOffset = nodeStartOffset ?? lineStartOffset;
  const startCharacter = startOffset - lineStartOffset;
  let text = "";
  let quote: "\"" | "'" | undefined;

  for (let line = startLine; line < textlines.length; line++) {
    const sourceLine = line === startLine ? textlines[line].slice(startCharacter) : textlines[line];
    for (const character of sourceLine) {
      text += character;
      if (quote !== undefined) {
        if (character === quote) quote = undefined;
      } else if (character === "\"" || character === "'") {
        quote = character;
      } else if (character === ">") {
        return { text, startOffset };
      }
    }
    text += "\n";
  }

  return { text, startOffset };
}

/** 将 WXML 全文偏移转换为 VS Code 的 0 基位置。 */
export function positionAt(textlines: string[], offset: number): vscode.Position {
  let remaining = offset;
  for (let line = 0; line < textlines.length; line++) {
    if (remaining <= textlines[line].length) return new vscode.Position(line, remaining);
    remaining -= textlines[line].length + 1;
  }

  return new vscode.Position(0, 0);
}

/** 定位 opening tag 中指定属性的带引号值范围。 */
export function findOpeningTagAttributeValueRange(
  textlines: string[],
  startLine: number,
  attributeName: string,
  value: string,
  nodeStartOffset?: number,
): vscode.Range {
  const openingTag = readOpeningTag(textlines, startLine, nodeStartOffset);
  const attributePattern = new RegExp(
    `\\b${escapeRegExp(attributeName)}\\s*=\\s*(["'])${escapeRegExp(value)}\\1`,
  );
  const match = attributePattern.exec(openingTag.text);
  if (match?.index === undefined) return new vscode.Range(startLine, 0, startLine, 0);

  const valueOffset = openingTag.startOffset + match.index + match[0].indexOf(value);
  const start = positionAt(textlines, valueOffset);

  return new vscode.Range(start, new vscode.Position(start.line, start.character + value.length));
}

/** 定位 opening tag 中指定属性名的范围。 */
export function findOpeningTagAttributeNameRange(
  textlines: string[],
  startLine: number,
  attributeName: string,
  nodeStartOffset?: number,
): vscode.Range {
  const openingTag = readOpeningTag(textlines, startLine, nodeStartOffset);
  const attributePattern = new RegExp(`\\b${escapeRegExp(attributeName)}(?=\\s*=|\\s|>)`);
  const match = attributePattern.exec(openingTag.text);
  if (match?.index === undefined) return new vscode.Range(startLine, 0, startLine, 0);

  const start = positionAt(textlines, openingTag.startOffset + match.index);

  return new vscode.Range(start, new vscode.Position(start.line, start.character + attributeName.length));
}

/** 定位 opening tag 中的标签名范围。 */
export function findOpeningTagNameRange(
  textlines: string[],
  startLine: number,
  tagName: string,
  nodeStartOffset?: number,
): vscode.Range {
  const openingTag = readOpeningTag(textlines, startLine, nodeStartOffset);
  const match = new RegExp(`<${escapeRegExp(tagName)}(?=\\s|>|/)`).exec(openingTag.text);
  if (match?.index === undefined) return new vscode.Range(startLine, 0, startLine, 0);

  const start = positionAt(textlines, openingTag.startOffset + match.index + 1);

  return new vscode.Range(start, new vscode.Position(start.line, start.character + tagName.length));
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
