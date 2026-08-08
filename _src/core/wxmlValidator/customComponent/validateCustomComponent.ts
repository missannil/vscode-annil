import { type Domhandler, vscode } from "#deps";
import { configuration } from "../../../configuration/index.js";
import type { AttrValue, CustomComponentInfo } from "../../types/TsFileInfo.js";
import { findOpeningTagAttributeNameRange, findOpeningTagAttributeValueRange } from "../element/openingTag.js";
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
  usedNames?: Set<string>,
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
    usedNames,
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
    if (
      actualNames.some((name) => getAttributeAliases(expectedName).includes(normalizeAttributeName(name)))
    ) continue;
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
  usedNames?: Set<string>,
): void {
  for (const [name, value] of Object.entries(node.attribs)) {
    if (name.startsWith("wx:")) continue;

    const expectedName = normalizeAttributeName(name);
    const expectedConfigName = Object.keys(componentInfo.configInfo).find((configName) =>
      getAttributeAliases(configName).includes(expectedName)
    );
    const expectedValue = expectedConfigName === undefined ? undefined : componentInfo.configInfo[expectedConfigName];
    if (expectedValue === undefined) {
      if (configuration.isAllowedAttribute(name)) {
        validateAllowedAttributeValue(node, startLine, name, value, validScopeNames, textlines, diagnostics, usedNames);
        continue;
      }
      addDiagnosticAtAttributeName(
        diagnostics,
        startLine,
        name,
        textlines,
        node.startIndex ?? undefined,
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
      node.startIndex ?? undefined,
      diagnostics,
      usedNames,
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
  usedNames?: Set<string>,
): void {
  validateMustacheText(
    value,
    validScopeNames,
    diagnostics,
    findOpeningTagAttributeValueRange(textlines, startLine, name, value, node.startIndex ?? undefined).start,
    usedNames,
  );
}

/**
 * CustomComponent 的内部字段以组件变量名作为前缀，WXML 对外暴露的属性不带该前缀。
 * 同时保留带前缀的写法，兼容旧项目和现有生成的 WXML。
 */
function getAttributeAliases(name: string): string[] {
  const separator = name.indexOf("_");
  if (separator < 0) return [name];

  return [name, name.slice(separator + 1)];
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
  nodeStartOffset: number | undefined,
  diagnostics: vscode.Diagnostic[],
  usedNames?: Set<string>,
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
        nodeStartOffset,
      );

      return;
    case "Root":
      validateExactMustache(
        name,
        value,
        expectedValue.value,
        startLine,
        tagNameStart,
        textlines,
        true,
        diagnostics,
        nodeStartOffset,
        usedNames,
      );

      return;
    case "Self":
      validateExactMustache(
        name,
        value,
        expectedValue.value,
        startLine,
        tagNameStart,
        textlines,
        true,
        diagnostics,
        nodeStartOffset,
      );

      return;
    case "Custom":
      validateCustomValue(name, value, startLine, validScopeNames, textlines, diagnostics, nodeStartOffset, usedNames);

      return;
    case "Ternary":
      validateTernaryValue(
        name,
        value,
        expectedValue.values,
        startLine,
        validScopeNames,
        textlines,
        diagnostics,
        nodeStartOffset,
        usedNames,
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
  nodeStartOffset?: number,
  usedNames?: Set<string>,
): void {
  const variableName = getMustacheExpression(value);
  if (variableName !== undefined && getTopName(variableName) === expectedName) usedNames?.add(expectedName);
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
      nodeStartOffset,
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
  nodeStartOffset?: number,
  expressionOffset?: number,
): void {
  const valueStart = findOpeningTagAttributeValueRange(textlines, startLine, name, value, nodeStartOffset).start;
  const expressionStart = new vscode.Position(
    valueStart.line,
    valueStart.character + Math.max(expressionOffset ?? value.indexOf(expression), 0),
  );
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(
      expressionStart,
      new vscode.Position(expressionStart.line, expressionStart.character + expression.length),
    ),
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
  nodeStartOffset: number | undefined,
  message: string,
  code?: string,
): void {
  const range = findOpeningTagAttributeNameRange(textlines, startLine, name, nodeStartOffset);
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
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
  nodeStartOffset?: number,
  usedNames?: Set<string>,
): void {
  for (const match of value.matchAll(/\{\{(.+?)\}\}/g)) {
    const expression = match[1];
    // 函数调用等复杂语法暂不做变量推断；比较、逻辑运算等表达式中的
    // 每个根变量都需要单独校验，不能把整个表达式当成一个变量名。
    if (expression.includes("(")) continue;

    for (const variable of getExpressionVariables(expression)) {
      usedNames?.add(variable.name);
      if (validScopeNames.has(variable.name)) continue;
      addDiagnosticAtMustacheExpression(
        diagnostics,
        startLine,
        name,
        value,
        variable.name,
        textlines,
        `未知数据: "${variable.name}"`,
        {},
        CustomComponentDiagnosticCode.unknownData,
        nodeStartOffset,
        value.indexOf("{{") + 2 + (match.index ?? 0) + variable.offset,
      );
    }
  }
}

type ExpressionVariable = { name: string; offset: number };

/** 提取表达式中的根变量，成员名、字符串内容和保留字不作为数据引用。 */
function getExpressionVariables(expression: string): ExpressionVariable[] {
  const withoutStrings = expression.replace(/(['"])(?:\\.|(?!\1).)*\1/g, (value) => " ".repeat(value.length));
  const variables: ExpressionVariable[] = [];
  const variablePattern = /[A-Za-z_$][\w$]*/g;
  const reservedNames = new Set(["true", "false", "null", "undefined"]);

  for (const match of withoutStrings.matchAll(variablePattern)) {
    const offset = match.index ?? 0;
    if (reservedNames.has(match[0]) || withoutStrings[offset - 1] === ".") continue;
    variables.push({ name: match[0], offset });
  }

  return variables;
}

function validateTernaryValue(
  name: string,
  value: string,
  expectedValues: string[],
  startLine: number,
  validScopeNames: ReadonlySet<string>,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
  nodeStartOffset?: number,
  usedNames?: Set<string>,
): void {
  const expression = getMustacheExpression(value);
  const match = expression === undefined ? undefined : TERNARY_RE.exec(expression);
  const [trueValue, falseValue] = expectedValues;
  if (match !== undefined && match !== null) usedNames?.add(getTopName(match[1]));
  if (match?.[2] === trueValue && match[3] === falseValue && validScopeNames.has(getTopName(match[1]))) return;

  addDiagnosticAtAttributeValue(
    diagnostics,
    startLine,
    name,
    value,
    textlines,
    `属性 "${name}" 应为 "{{condition ? ${trueValue} : ${falseValue}}}"`,
    { replaceText: `{{condition ? ${trueValue} : ${falseValue}}}` },
    CustomComponentDiagnosticCode.attributeValueMismatch,
    nodeStartOffset,
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
  nodeStartOffset?: number,
): void {
  const range = findOpeningTagAttributeValueRange(textlines, startLine, name, value, nodeStartOffset);
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = info;
  diagnostics.push(diagnostic);
}
