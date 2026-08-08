import { type Domhandler, vscode } from "#deps";
import type { TsFileInfo } from "../../types/TsFileInfo.js";
import type { WxmlValidationContext } from "../context.js";
import { findOpeningTagNameRange, positionAt, readOpeningTag } from "./openingTag.js";

const identifierPattern = /^[A-Za-z_$][\w$]*$/;
const mustachePattern = /^\{\{\s*(.*?)\s*\}\}$/s;

export const WxForAttributeDiagnosticCode = {
  missingValue: "annil.wxFor.missingValue",
  mustacheSyntax: "annil.wxFor.mustacheSyntax",
  invalidExpression: "annil.wxFor.invalidExpression",
  invalidVariable: "annil.wxFor.invalidVariable",
  unknownData: "annil.wxFor.unknownData",
  nonArrayData: "annil.wxFor.nonArrayData",
  variableConflict: "annil.wxFor.variableConflict",
} as const;

/** 校验 wx:for、wx:for-item、wx:for-index 和 wx:key 的值。 */
// eslint-disable-next-line complexity -- wx:for 属性按值、变量和作用域阶段校验
export function validateWxForAttributes(
  node: Domhandler.Element,
  startLine: number,
  context: WxmlValidationContext,
  tsFileInfo: TsFileInfo,
): void {
  if (node.name !== "block") return;

  const attributes = node.attribs;
  const itemName = attributes["wx:for-item"] ?? "item";
  const indexName = attributes["wx:for-index"] ?? "index";
  const outerItems = new Set(context.scope.wxForItemNames);
  const outerIndexes = new Set(context.scope.wxForIndexNames);
  const arrays = new Set(tsFileInfo.rootComponentInfo.arrTypeDatas);
  const knownNames = new Set([
    ...arrays,
    ...tsFileInfo.rootComponentInfo.dataList,
    ...context.scope.wxForItemNames,
    ...context.scope.wxForIndexNames,
  ]);

  const nodeStartOffset = node.startIndex ?? undefined;
  validateNoValue(node, attributes, "wx:for", startLine, context, nodeStartOffset);
  validateNoValue(node, attributes, "wx:for-item", startLine, context, nodeStartOffset);
  validateNoValue(node, attributes, "wx:for-index", startLine, context, nodeStartOffset);
  validateNoValue(node, attributes, "wx:key", startLine, context, nodeStartOffset);

  if ("wx:for" in attributes && attributes["wx:for"] !== "") {
    const rawValue = attributes["wx:for"];
    const match = mustachePattern.exec(rawValue);
    if (!match) {
      addDiagnostic(
        node,
        context,
        startLine,
        "wx:for 值必须使用 mustache",
        "wx:for",
        WxForAttributeDiagnosticCode.mustacheSyntax,
        nodeStartOffset,
      );
    } else {
      validateForExpression(node, match[1].trim(), arrays, knownNames, context, startLine, nodeStartOffset);
    }
  }

  if ("wx:key" in attributes && attributes["wx:key"] !== "") {
    const key = attributes["wx:key"];
    if (key !== "*this" && !identifierPattern.test(key)) {
      addDiagnostic(
        node,
        context,
        startLine,
        `无效的变量: "${key}"`,
        key,
        WxForAttributeDiagnosticCode.invalidVariable,
        nodeStartOffset,
      );
    }
  }

  validateLoopVariable(
    node,
    itemName,
    "wx:for-item",
    outerItems,
    outerIndexes,
    context,
    startLine,
    nodeStartOffset,
    "wx:for-item" in attributes,
  );
  validateLoopVariable(
    node,
    indexName,
    "wx:for-index",
    outerItems,
    outerIndexes,
    context,
    startLine,
    nodeStartOffset,
    "wx:for-index" in attributes,
  );
}

function validateForExpression(
  node: Domhandler.Element,
  expression: string,
  arrays: Set<string>,
  knownNames: Set<string>,
  context: WxmlValidationContext,
  startLine: number,
  nodeStartOffset?: number,
): void {
  const rootMatch = /^([A-Za-z_$][\w$]*)/.exec(expression);
  if (!rootMatch) {
    addDiagnostic(
      node,
      context,
      startLine,
      `无效的变量: "${expression}"`,
      expression,
      WxForAttributeDiagnosticCode.invalidVariable,
      nodeStartOffset,
    );

    return;
  }
  if (rootMatch[0] !== expression && !/[.[\]]/.test(expression.slice(rootMatch[0].length))) {
    addDiagnostic(
      node,
      context,
      startLine,
      "wx:for 值必须是有效表达式",
      "wx:for",
      WxForAttributeDiagnosticCode.invalidExpression,
      nodeStartOffset,
    );

    return;
  }

  const root = rootMatch[1];
  const isMemberExpression = expression.length > root.length;
  if (isMemberExpression) {
    if (!knownNames.has(root)) {
      addDiagnostic(
        node,
        context,
        startLine,
        `未知数据: "${root}"`,
        root,
        WxForAttributeDiagnosticCode.unknownData,
        nodeStartOffset,
      );
    }

    return;
  }
  if (!knownNames.has(root)) {
    addDiagnostic(
      node,
      context,
      startLine,
      `未知数据: "${root}"`,
      root,
      WxForAttributeDiagnosticCode.unknownData,
      nodeStartOffset,
    );
  } else if (arrays.size > 0 && !arrays.has(root) && !context.scope.wxForItemNames.includes(root)) {
    addDiagnostic(
      node,
      context,
      startLine,
      `wx:for 数据必须是数组类型: "${root}"`,
      root,
      WxForAttributeDiagnosticCode.nonArrayData,
      nodeStartOffset,
    );
  }
}

function validateLoopVariable(
  node: Domhandler.Element,
  name: string,
  attributeName: string,
  outerItems: Set<string>,
  outerIndexes: Set<string>,
  context: WxmlValidationContext,
  startLine: number,
  nodeStartOffset?: number,
  checkConflict = true,
): void {
  if (!identifierPattern.test(name)) {
    addDiagnostic(
      node,
      context,
      startLine,
      `无效的变量: "${name}"`,
      name,
      WxForAttributeDiagnosticCode.invalidVariable,
      nodeStartOffset,
    );

    return;
  }

  if (checkConflict && (outerItems.has(name) || outerIndexes.has(name))) {
    addDiagnostic(
      node,
      context,
      startLine,
      `变量名冲突: "${name}"`,
      name,
      WxForAttributeDiagnosticCode.variableConflict,
      nodeStartOffset,
    );
  }
}

function validateNoValue(
  node: Domhandler.Element,
  attributes: Record<string, string>,
  attributeName: string,
  startLine: number,
  context: WxmlValidationContext,
  nodeStartOffset?: number,
): void {
  if (attributeName in attributes && attributes[attributeName] === "") {
    addDiagnostic(
      node,
      context,
      startLine,
      `${attributeName} 不可无值`,
      attributeName,
      WxForAttributeDiagnosticCode.missingValue,
      nodeStartOffset,
    );
  }
}

function addDiagnostic(
  node: Domhandler.Element,
  context: WxmlValidationContext,
  line: number,
  message: string,
  attributeName: string,
  code: string,
  nodeStartOffset?: number,
): void {
  const location = findAttributeLocation(context.textlines, line, attributeName, nodeStartOffset);
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(location.line, location.character, location.line, location.character + attributeName.length),
    message,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = code;
  context.diagnosticList.push(diagnostic);
}

/** 在当前元素 opening tag 的行范围内定位属性名或属性值。 */
// eslint-disable-next-line complexity -- 优先节点 opening tag，失败时兼容旧行扫描
function findAttributeLocation(
  textlines: string[],
  startLine: number,
  text: string,
  nodeStartOffset?: number,
): { line: number; character: number } {
  if (nodeStartOffset !== undefined) {
    const openingTag = readOpeningTag(textlines, startLine, nodeStartOffset);
    const localOffset = openingTag.text.indexOf(text);
    if (localOffset >= 0) {
      const position = positionAt(textlines, openingTag.startOffset + localOffset);

      return { line: position.line, character: position.character };
    }

    // 默认的 wx:for-item / wx:for-index 没有实际属性文本，不能继续向后扫描，
    // 否则会把后续子节点中的 item/index 误当成当前循环变量的位置。
    const tagRange = findOpeningTagNameRange(textlines, startLine, "block", nodeStartOffset);

    return { line: tagRange.start.line, character: tagRange.start.character };
  }

  let quote: "\"" | "'" | undefined;
  for (let line = startLine; line < textlines.length; line++) {
    const sourceLine = textlines[line];
    const offset = sourceLine.indexOf(text);
    if (offset >= 0) return { line, character: offset };

    for (const character of sourceLine) {
      if (quote !== undefined) {
        if (character === quote) quote = undefined;
      } else if (character === "\"" || character === "'") {
        quote = character;
      } else if (character === ">") {
        return { line: startLine, character: 0 };
      }
    }
  }

  return { line: startLine, character: 0 };
}
