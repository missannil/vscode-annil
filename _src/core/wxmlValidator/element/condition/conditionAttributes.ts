import { vscode } from "#deps";
import { positionAt, readOpeningTag } from "../openingTag.js";

export const conditionAttributeNames = ["wx:if", "wx:elif", "wx:else"] as const;

export type ConditionAttributeName = (typeof conditionAttributeNames)[number];

export type ConditionAttribute = {
  name: ConditionAttributeName;
  range: vscode.Range;
  hasValue: boolean;
  value: string | undefined;
};

/** 读取当前 block opening tag 内的条件属性及精确源码位置。 */
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
    attributes.push({
      name,
      range: new vscode.Range(start, new vscode.Position(start.line, start.character + name.length)),
      hasValue: rawValue !== undefined,
      value: rawValue === undefined ? undefined : unquoteAttributeValue(rawValue),
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
