import type { Element } from "domhandler";

import type { CheckContext, ConditionAttrName } from "../../../../CheckContext";

import { checkConditionalBlock } from "./checkConditionalBlock";
import { checkWxForBlock } from "./checkWxForBlock";
import { validateEmptyAttr } from "./validateEmptyAttr";
import { validateUnknownAttr } from "./validateUnknownAttr";

export const conditionalAttrs = ["wx:if", "wx:elif", "wx:else"] as const satisfies ConditionAttrName[];

export type LoopAttr = "wx:for" | "wx:for-item" | "wx:for-index" | "wx:key";

export const loopAttrs: LoopAttr[] = ["wx:for", "wx:for-item", "wx:for-index", "wx:key"] as const satisfies LoopAttr[];

function isWxForBlock(attrNames: string[]): boolean {
  return attrNames.some((attrName) => loopAttrs.includes(attrName as LoopAttr));
}

function isConditionalBlock(attrNames: string[]): boolean {
  return attrNames.some((attrName) => conditionalAttrs.includes(attrName as ConditionAttrName));
}

function filterUnknwonAttrs(
  attribs: Record<string, string>,
  unknownAttrs: string[],
): Record<string, string> {
  return Object.keys(attribs).reduce<Record<string, string>>((acc, cur) => {
    if (!unknownAttrs.includes(cur)) acc[cur] = attribs[cur];

    return acc;
  }, {});
}

export function checkBlockTag(
  element: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, preConditionAttrName: previousConditionAttr, diagnosticList } = checkContext;
  const attribs = element.attribs;
  const childNodes = element.childNodes;
  const rawAttrNames = Object.keys(attribs);
  // 1. 空属性检测
  if (!validateEmptyAttr(rawAttrNames, textlines, startLine, previousConditionAttr, diagnosticList)) return;
  // 2. 未知属性名检测
  const unknownAttrs = validateUnknownAttr(rawAttrNames, textlines, startLine, diagnosticList);
  const remainingAttribs = filterUnknwonAttrs(attribs, unknownAttrs);
  const remainingRawAttrNames = Object.keys(remainingAttribs);
  if (remainingRawAttrNames.length === 0) return;
  if (isWxForBlock(remainingRawAttrNames)) {
    checkWxForBlock(childNodes, remainingAttribs, startLine, checkContext);
  } else if (isConditionalBlock(remainingRawAttrNames)) {
    checkConditionalBlock(childNodes, remainingAttribs, startLine, checkContext);
  }
}
