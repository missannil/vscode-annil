import { type Domhandler, vscode } from "#deps";
import { findOpeningTagAttributeValueRange } from "./openingTag.js";

const NATIVE_EVENT_CODE = "annil.nativeEvent.unknown";

/** 校验原生元素 bind:/catch: 事件绑定是否声明在 RootComponent 中。 */
export function validateNativeEvents(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  eventNames: readonly string[],
  diagnostics: vscode.Diagnostic[],
): void {
  for (const [attributeName, value] of Object.entries(node.attribs)) {
    if (!isNativeEventAttribute(attributeName) || eventNames.includes(value)) continue;

    const range = findOpeningTagAttributeValueRange(textlines, startLine, attributeName, value);
    const diagnostic = new vscode.Diagnostic(range, "无效事件", vscode.DiagnosticSeverity.Error);
    diagnostic.source = "vscode-annil";
    diagnostic.code = NATIVE_EVENT_CODE;
    diagnostics.push(diagnostic);
  }
}

function isNativeEventAttribute(attributeName: string): boolean {
  return attributeName.startsWith("bind:") || attributeName.startsWith("catch:");
}
