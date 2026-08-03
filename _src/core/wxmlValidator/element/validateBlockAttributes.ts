import { type Domhandler, vscode } from "#deps";
import { findOpeningTagAttributeNameRange } from "./openingTag.js";

const allowedBlockAttributes = new Set([
  "wx:if",
  "wx:elif",
  "wx:else",
  "wx:for",
  "wx:for-item",
  "wx:for-index",
  "wx:key",
]);

export const BlockAttributeDiagnosticCode = "annil.block.unknownAttribute";

/** block 仅允许条件链和循环控制属性。 */
export function validateBlockAttributes(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  if (node.name !== "block") return;

  for (const attributeName of Object.keys(node.attribs)) {
    if (allowedBlockAttributes.has(attributeName)) continue;

    const diagnostic = new vscode.Diagnostic(
      findOpeningTagAttributeNameRange(textlines, startLine, attributeName),
      `未知属性: "${attributeName}"`,
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = "vscode-annil";
    diagnostic.code = BlockAttributeDiagnosticCode;
    diagnostics.push(diagnostic);
  }
}
