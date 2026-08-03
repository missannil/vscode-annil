import { type Domhandler, vscode } from "#deps";
import { findOpeningTagNameRange } from "./openingTag.js";

const loopAttributeNames = new Set(["wx:for", "wx:for-item", "wx:for-index", "wx:key"]);

export const WxForDiagnosticCode = {
  missingFor: "annil.wxFor.missingFor",
  missingKey: "annil.wxFor.missingKey",
} as const;

/** 校验 block 循环是否包含必要的 wx:for 和 wx:key 属性。 */
export function validateWxForStructure(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
  nodeStartOffset?: number,
): void {
  if (node.name !== "block") return;

  const attributeNames = Object.keys(node.attribs);
  if (!attributeNames.some((name) => loopAttributeNames.has(name))) return;

  const tagNameRange = findOpeningTagNameRange(textlines, startLine, node.name, nodeStartOffset);
  if (!attributeNames.includes("wx:for")) {
    diagnostics.push(createDiagnostic(tagNameRange, "缺少wx:for属性", WxForDiagnosticCode.missingFor));
  }
  if (!attributeNames.includes("wx:key")) {
    diagnostics.push(createDiagnostic(tagNameRange, "缺少wx:key属性", WxForDiagnosticCode.missingKey));
  }
}

function createDiagnostic(range: vscode.Range, message: string, code: string): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
  diagnostic.source = "vscode-annil";
  diagnostic.code = code;

  return diagnostic;
}
