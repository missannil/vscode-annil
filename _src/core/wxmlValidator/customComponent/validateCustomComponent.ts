import { type Domhandler, vscode } from "#deps";
import type { AttrValue, CustomComponentInfo } from "../../types/TsFileInfo.js";

const MUSTACHE_RE = /^\{\{\s*(.*?)\s*\}\}$/;
const TERNARY_RE = /^([\w$.]+)\s*\?\s*([\w$.]+)\s*:\s*([\w$.]+)$/;

/** 校验自定义组件标签的属性契约。 */
export function validateCustomComponent(
  node: Domhandler.Element,
  startLine: number,
  componentInfo: CustomComponentInfo,
  rootDataNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  const expectedNames = Object.keys(componentInfo.configInfo);
  const actualNames = Object.keys(node.attribs);

  for (const expectedName of expectedNames) {
    if (actualNames.some((name) => normalizeAttributeName(name) === expectedName)) continue;
    addDiagnostic(diagnostics, startLine, node.name.length, `缺少属性: "${expectedName}"`);
  }

  for (const [name, value] of Object.entries(node.attribs)) {
    if (name.startsWith("wx:")) continue;

    const expectedName = normalizeAttributeName(name);
    const expectedValue = componentInfo.configInfo[expectedName];
    if (expectedValue === undefined) {
      addDiagnostic(diagnostics, startLine, node.name.length, `未知属性: "${name}"`);
      continue;
    }

    validateAttributeValue(name, value, expectedValue, startLine, rootDataNames, diagnostics);
  }
}

function normalizeAttributeName(name: string): string {
  return name.replaceAll(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function validateAttributeValue(
  name: string,
  value: string,
  expectedValue: AttrValue,
  startLine: number,
  rootDataNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  switch (expectedValue.type) {
    case "Events":
      if (value === expectedValue.value) return;
      addDiagnostic(diagnostics, startLine, name.length, `事件属性 "${name}" 应绑定 "${expectedValue.value}"`);

      return;
    case "Root":
    case "Self":
      validateExactMustache(name, value, expectedValue.value, startLine, diagnostics);

      return;
    case "Custom":
      validateCustomValue(value, startLine, rootDataNames, diagnostics);

      return;
    case "Ternary":
      validateTernaryValue(name, value, expectedValue.values, startLine, rootDataNames, diagnostics);
  }
}

function validateExactMustache(
  name: string,
  value: string,
  expectedName: string,
  startLine: number,
  diagnostics: vscode.Diagnostic[],
): void {
  const variableName = getMustacheExpression(value);
  if (variableName === expectedName) return;

  addDiagnostic(diagnostics, startLine, name.length, `属性 "${name}" 应绑定 "{{${expectedName}}}"`);
}

function validateCustomValue(
  value: string,
  startLine: number,
  rootDataNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const match of value.matchAll(/\{\{(.+?)\}\}/g)) {
    const topName = getTopName(match[1]);
    if (topName === "" || rootDataNames.has(topName)) continue;
    addDiagnostic(
      diagnostics,
      startLine,
      match[0].length,
      `未知数据: "${topName}"`,
      vscode.DiagnosticSeverity.Error,
    );
  }
}

function validateTernaryValue(
  name: string,
  value: string,
  expectedValues: string[],
  startLine: number,
  rootDataNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  const expression = getMustacheExpression(value);
  const match = expression === undefined ? undefined : TERNARY_RE.exec(expression);
  const [trueValue, falseValue] = expectedValues;
  if (match?.[2] === trueValue && match[3] === falseValue && rootDataNames.has(getTopName(match[1]))) return;

  addDiagnostic(
    diagnostics,
    startLine,
    name.length,
    `属性 "${name}" 应为 "{{condition ? ${trueValue} : ${falseValue}}}"`,
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
  severity = vscode.DiagnosticSeverity.Warning,
): void {
  diagnostics.push(
    new vscode.Diagnostic(
      new vscode.Range(startLine, 0, startLine, length),
      message,
      severity,
    ),
  );
}
