import { vscode } from "#deps";
import { positionAt, readOpeningTag } from "../openingTag.js";

export const conditionAttributeNames = ["wx:if", "wx:elif", "wx:else"] as const;

export type ConditionAttributeName = (typeof conditionAttributeNames)[number];

export type ConditionAttribute = {
  name: ConditionAttributeName;
  range: vscode.Range;
  valueRange: vscode.Range | undefined;
  expressionRange: vscode.Range | undefined;
  hasValue: boolean;
  value: string | undefined;
};

/** 读取当前 block opening tag 内的条件属性及精确源码位置。 */
// eslint-disable-next-line complexity
export function getConditionAttributes(
  textlines: string[],
  startLine: number,
  nodeStartOffset?: number,
): ConditionAttribute[] {
  const openingTag = readOpeningTag(textlines, startLine, nodeStartOffset);
  const attributes: ConditionAttribute[] = [];
  const attributePattern = /\b(wx:(?:if|elif|else))\b\s*(?:=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;

  for (const match of openingTag.text.matchAll(attributePattern)) {
    const name = match[1] as ConditionAttributeName;
    const rawValue = match[2];
    const startOffset = openingTag.startOffset + (match.index ?? 0);
    const start = positionAt(textlines, startOffset);
    const value = rawValue === undefined ? undefined : unquoteAttributeValue(rawValue);
    const valueStartOffset = rawValue === undefined
      ? undefined
      : openingTag.startOffset + (match.index ?? 0) + match[0].indexOf(rawValue)
        + (rawValue.startsWith("\"") || rawValue.startsWith("'") ? 1 : 0);
    const valueStart = valueStartOffset === undefined ? undefined : positionAt(textlines, valueStartOffset);
    const valueEnd = valueStartOffset === undefined || value === undefined
      ? undefined
      : positionAt(textlines, valueStartOffset + value.length);
    const expression = value?.trim();
    const expressionContent = expression?.startsWith("{{") === true && expression.endsWith("}}")
      ? expression.slice(2, -2).trim()
      : undefined;
    const expressionOffset = expressionContent === undefined || valueStartOffset === undefined || value === undefined
      ? undefined
      : value.indexOf(expressionContent);
    let expressionStart: vscode.Position | undefined;
    let expressionEnd: vscode.Position | undefined;
    if (expressionOffset !== undefined && valueStartOffset !== undefined && expressionContent !== undefined) {
      expressionStart = positionAt(textlines, valueStartOffset + expressionOffset);
      expressionEnd = positionAt(textlines, valueStartOffset + expressionOffset + expressionContent.length);
    }
    attributes.push({
      name,
      range: new vscode.Range(start, new vscode.Position(start.line, start.character + name.length)),
      hasValue: rawValue !== undefined,
      valueRange: valueStart === undefined || valueEnd === undefined
        ? undefined
        : new vscode.Range(valueStart, valueEnd),
      expressionRange: expressionStart === undefined || expressionEnd === undefined
        ? undefined
        : new vscode.Range(expressionStart, expressionEnd),
      value,
    });
  }

  return attributes;
}

function unquoteAttributeValue(value: string): string {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}
