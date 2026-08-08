import { type Domhandler, vscode } from "#deps";
import { configuration } from "../../../configuration/index.js";
import type { AttrValue, CustomComponentInfo } from "../../types/TsFileInfo.js";
import { findOpeningTagAttributeValueRange } from "../element/openingTag.js";
import { validateMustacheText } from "../expression/validateMustache.js";

const MUSTACHE_RE = /^\{\{\s*(.*?)\s*\}\}$/;
const TERNARY_RE = /^([\w$.]+)\s*\?\s*([\w$.]+)\s*:\s*([\w$.]+)$/;
const OPTIONAL_COMPONENT_ATTRIBUTES = new Set(["isReady"]);

export const CustomComponentDiagnosticCode = {
  missingAttribute: "annil.customComponent.missingAttribute",
  unknownAttribute: "annil.customComponent.unknownAttribute",
  attributeValueMismatch: "annil.customComponent.attributeValueMismatch",
  eventValueMismatch: "annil.customComponent.eventValueMismatch",
  unknownData: "annil.customComponent.unknownData",
} as const;

/** 校验自定义组件标签的属性契约。 */
export function validateCustomComponent(
  node: Domhandler.Element,
  startLine: number,
  componentInfo: CustomComponentInfo,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const tagNameStart = getTagNameStart(node.name, startLine, textlines);

  validateMissingAttributes(node, startLine, componentInfo, tagNameStart, diagnostics);
  validateExistingAttributes(
    node,
    startLine,
    componentInfo,
    validScopeNames,
    textlines,
    tagNameStart,
    diagnostics,
  );
}

function validateMissingAttributes(
  node: Domhandler.Element,
  startLine: number,
  componentInfo: CustomComponentInfo,
  tagNameStart: number,
  diagnostics: vscode.Diagnostic[],
): void {
  const actualNames = Object.keys(node.attribs);

  for (const expectedName of Object.keys(componentInfo.configInfo)) {
    if (isOptionalComponentAttribute(expectedName)) continue;
    if (actualNames.some((name) => normalizeAttributeName(name) === expectedName)) continue;
    addDiagnostic(
      diagnostics,
      startLine,
      node.name.length,
      `缺少属性: "${expectedName}"`,
      vscode.DiagnosticSeverity.Error,
      { replaceText: `${expectedName}="${getExpectedAttributeValue(componentInfo.configInfo[expectedName])}"` },
      tagNameStart,
      CustomComponentDiagnosticCode.missingAttribute,
    );
  }
}

/** `isReady` 只用于外层 block wx:if，不要求重复传入子组件。 */
function isOptionalComponentAttribute(name: string): boolean {
  if (OPTIONAL_COMPONENT_ATTRIBUTES.has(name)) return true;
  const prefixSeparator = name.indexOf("_");

  return prefixSeparator >= 0 && OPTIONAL_COMPONENT_ATTRIBUTES.has(name.slice(prefixSeparator + 1));
}

function validateExistingAttributes(
  node: Domhandler.Element,
  startLine: number,
  componentInfo: CustomComponentInfo,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  tagNameStart: number,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const [name, value] of Object.entries(node.attribs)) {
    if (name.startsWith("wx:")) continue;

    const expectedName = normalizeAttributeName(name);
    const expectedValue = componentInfo.configInfo[expectedName];
    if (expectedValue === undefined) {
      if (configuration.isAllowedAttribute(name)) {
        validateAllowedAttributeValue(node, startLine, name, value, validScopeNames, textlines, diagnostics);
        continue;
      }
      addDiagnosticAtAttributeName(
        diagnostics,
        startLine,
        name,
        textlines,
        `未知属性: "${name}"`,
        CustomComponentDiagnosticCode.unknownAttribute,
      );
      continue;
    }

    validateAttributeValue(
      name,
      value,
      expectedValue,
      startLine,
      validScopeNames,
      textlines,
      tagNameStart,
      diagnostics,
    );
  }
}

/**
 * 校验配置允许透传的未知属性。
 *
 * 允许的是属性名，不是属性值；因此不做组件契约值匹配，但仍校验值中的
 * mustache 变量是否存在于当前 WXML 作用域中。
 */
function validateAllowedAttributeValue(
  node: Domhandler.Element,
  startLine: number,
  name: string,
  value: string,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  validateMustacheText(
    value,
    validScopeNames,
    diagnostics,
    findOpeningTagAttributeValueRange(textlines, startLine, name, value, node.startIndex ?? undefined).start,
  );
}

function normalizeAttributeName(name: string): string {
  return name.replaceAll(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function validateAttributeValue(
  name: string,
  value: string,
  expectedValue: AttrValue,
  startLine: number,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  tagNameStart: number,
  diagnostics: vscode.Diagnostic[],
): void {
  switch (expectedValue.type) {
    case "Events":
      if (value === expectedValue.value) return;
      addDiagnosticAtAttributeValue(
        diagnostics,
        startLine,
        name,
        value,
        textlines,
        `事件属性 "${name}" 应绑定 "${expectedValue.value}"`,
        {},
        CustomComponentDiagnosticCode.eventValueMismatch,
      );

      return;
    case "Root":
      validateExactMustache(name, value, expectedValue.value, startLine, tagNameStart, textlines, true, diagnostics);

      return;
    case "Self":
      validateExactMustache(name, value, expectedValue.value, startLine, tagNameStart, textlines, true, diagnostics);

      return;
    case "Custom":
      validateCustomValue(name, value, startLine, validScopeNames, textlines, diagnostics);

      return;
    case "Ternary":
      validateTernaryValue(
        name,
        value,
        expectedValue.values,
        startLine,
        validScopeNames,
        tagNameStart,
        diagnostics,
      );
  }
}

function validateExactMustache(
  name: string,
  value: string,
  expectedName: string,
  startLine: number,
  tagNameStart: number,
  textlines: string[],
  useValueRange: boolean,
  diagnostics: vscode.Diagnostic[],
): void {
  const variableName = getMustacheExpression(value);
  if (variableName === expectedName) return;

  const message = `属性 "${name}" 应绑定 "{{${expectedName}}}"`;
  if (useValueRange) {
    addDiagnosticAtMustacheExpression(
      diagnostics,
      startLine,
      name,
      value,
      variableName ?? value,
      textlines,
      message,
      { replaceText: `{{${expectedName}}}` },
      CustomComponentDiagnosticCode.attributeValueMismatch,
    );

    return;
  }

  addDiagnostic(
    diagnostics,
    startLine,
    name.length,
    message,
    vscode.DiagnosticSeverity.Error,
    { replaceText: `{{${expectedName}}}` },
    tagNameStart,
    CustomComponentDiagnosticCode.attributeValueMismatch,
  );
}

function addDiagnosticAtMustacheExpression(
  diagnostics: vscode.Diagnostic[],
  startLine: number,
  name: string,
  value: string,
  expression: string,
  textlines: string[],
  message: string,
  info: Record<string, unknown> = {},
  code?: string,
): void {
  const lineText = textlines[startLine] ?? "";
  const attributeStart = lineText.indexOf(`${name}="${value}"`);
  const valueStart = attributeStart >= 0 ? attributeStart + name.length + 2 : 0;
  const expressionStart = valueStart + Math.max(value.indexOf(expression), 0);
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(startLine, expressionStart, startLine, expressionStart + expression.length),
    message,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = info;
  diagnostics.push(diagnostic);
}

function addDiagnosticAtAttributeName(
  diagnostics: vscode.Diagnostic[],
  startLine: number,
  name: string,
  textlines: string[],
  message: string,
  code?: string,
): void {
  const attributeLine = textlines.findIndex((line, index) => index >= startLine && line.includes(name));
  const line = attributeLine >= 0 ? attributeLine : startLine;
  const lineText = textlines[line] ?? "";
  const nameStart = lineText.indexOf(name);
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(line, Math.max(nameStart, 0), line, Math.max(nameStart, 0) + name.length),
    message,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  diagnostics.push(diagnostic);
}

function validateCustomValue(
  name: string,
  value: string,
  startLine: number,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  for (const match of value.matchAll(/\{\{(.+?)\}\}/g)) {
    const topName = getTopName(match[1]);
    if (topName === "" || validScopeNames.has(topName)) continue;
    addDiagnosticAtMustacheExpression(
      diagnostics,
      startLine,
      name,
      value,
      topName,
      textlines,
      `未知数据: "${topName}"`,
      {},
      CustomComponentDiagnosticCode.unknownData,
    );
  }
}

function validateTernaryValue(
  name: string,
  value: string,
  expectedValues: string[],
  startLine: number,
  validScopeNames: ReadonlySet<string>,
  tagNameStart: number,
  diagnostics: vscode.Diagnostic[],
): void {
  const expression = getMustacheExpression(value);
  const match = expression === undefined ? undefined : TERNARY_RE.exec(expression);
  const [trueValue, falseValue] = expectedValues;
  if (match?.[2] === trueValue && match[3] === falseValue && validScopeNames.has(getTopName(match[1]))) return;

  addDiagnostic(
    diagnostics,
    startLine,
    name.length,
    `属性 "${name}" 应为 "{{condition ? ${trueValue} : ${falseValue}}}"`,
    vscode.DiagnosticSeverity.Error,
    { replaceText: `{{condition ? ${trueValue} : ${falseValue}}}` },
    tagNameStart,
    CustomComponentDiagnosticCode.attributeValueMismatch,
  );
}

function getMustacheExpression(value: string): string | undefined {
  return MUSTACHE_RE.exec(value)?.[1];
}

function getTopName(expression: string): string {
  return expression.trim().split(".")[0];
}

function addDiagnostic(
  diagnostics: vscode.Diagnostic[],
  startLine: number,
  length: number,
  message: string,
  severity = vscode.DiagnosticSeverity.Error,
  info: Record<string, unknown> = {},
  startCharacter = 0,
  code?: string,
): void {
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(startLine, startCharacter, startLine, startCharacter + length),
    message,
    severity,
  );
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = info;
  diagnostics.push(diagnostic);
}

function getTagNameStart(tagName: string, startLine: number, textlines: string[]): number {
  const lineText = textlines[startLine] ?? "";
  const tagStart = lineText.indexOf(`<${tagName}`);

  return tagStart >= 0 ? tagStart + 1 : 0;
}

function getExpectedAttributeValue(expectedValue: AttrValue): string {
  switch (expectedValue.type) {
    case "Events":
      return expectedValue.value;
    case "Root":
    case "Self":
      return `{{${expectedValue.value}}}`;
    case "Custom":
      return "{{自定义}}";
    case "Ternary":
      return `{{condition ? ${expectedValue.values[0]} : ${expectedValue.values[1]}}}`;
  }
}

function addDiagnosticAtAttributeValue(
  diagnostics: vscode.Diagnostic[],
  startLine: number,
  name: string,
  value: string,
  textlines: string[],
  message: string,
  info: Record<string, unknown> = {},
  code?: string,
): void {
  const lineText = textlines[startLine] ?? "";
  const attributeValue = `${name}="${value}"`;
  const attributeStart = lineText.indexOf(attributeValue);
  const valueStart = attributeStart >= 0 ? attributeStart + name.length + 2 : 0;
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(startLine, valueStart, startLine, valueStart + value.length),
    message,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = info;
  diagnostics.push(diagnostic);
}
