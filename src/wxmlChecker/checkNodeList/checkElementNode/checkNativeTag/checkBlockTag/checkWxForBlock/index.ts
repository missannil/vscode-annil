import type { ChildNode } from "domhandler";
import { checkChildNodes } from "../../../../../checkChildNodes";
import type { CheckContext } from "../../../../../CheckContext";
import { validateWithoutValue } from "../../../../../validators/validateWithoutValue";
import { validateMissingWxfor } from "./validateMissingWxFor";
import { validateMissingWxkey } from "./validateMissingWxkey";
import { validateNotFoundWxForItemAndIndex } from "./validateNotFoundWxForItemAndIndex";
import { validateWxForItemAndIndex } from "./validateWxForItemAndIndex";
import { validateWxforValue } from "./validateWxforValue";
import { validateWxkey } from "./validateWxkey";

export type WxForVariables = { "wx:for-index": string; "wx:for-item": string };

export type CheckWxForBlockResult = WxForVariables;

function getFixCode(rawAttrName: string): string {
  switch (rawAttrName) {
    case "wx:for":
      return "wx:for=\"{{数组类型变量名}}\"";

    case "wx:key":
      return `${rawAttrName}="子属性名或*this"`;

    case "wx:for-item":
      return `${rawAttrName}="变量名"`;

    case "wx:for-index":
      return `${rawAttrName}="变量名"`;
  }
  throw new Error(`未知属性名: ${rawAttrName}`);
}

export function checkWxForBlock(
  childNodes: ChildNode[],
  rawAttribs: Record<string, string>,
  startLine: number,
  checkContext: CheckContext,
): void {
  const wxForVariables: WxForVariables = { "wx:for-index": "index", "wx:for-item": "item" };

  const attrNames = Object.keys(rawAttribs);
  validateMissingWxfor(attrNames, startLine, checkContext);
  validateMissingWxkey(attrNames, startLine, checkContext);
  for (const rawAttrName of attrNames) {
    const rawAttrValue = rawAttribs[rawAttrName];
    // 无值检测 报错在属性上 例如: wx:for (注意,无值指未写值的属性      而`wx:for=""`值为空串而非无值)
    if (
      !validateWithoutValue(
        rawAttrName,
        startLine,
        checkContext.textlines,
        checkContext.diagnosticList,
        getFixCode(rawAttrName),
      )
    ) continue;
    if (rawAttrName === "wx:for") {
      validateWxforValue(rawAttrValue, startLine, checkContext);
    } else if (rawAttrName === "wx:for-item" || rawAttrName === "wx:for-index") {
      const pass = validateWxForItemAndIndex(rawAttrName, rawAttrValue, startLine, checkContext);
      pass && (wxForVariables[rawAttrName] = rawAttrValue);
    } else if (rawAttrName === "wx:key") {
      validateWxkey(rawAttrValue, startLine, checkContext);
    }
  }
  // 检测未定义wx:for-item和wx:for-index时,是否与上层定义重复
  validateNotFoundWxForItemAndIndex(attrNames, startLine, checkContext);
  checkChildNodes(childNodes, checkContext, wxForVariables);
}
