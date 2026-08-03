import { type Domhandler, vscode } from "#deps";
import { findOpeningTagNameRange } from "./openingTag.js";

export const EmptyBlockDiagnosticCode = "annil.block.empty";

/** block 必须至少声明一个条件或循环控制属性。 */
export function validateEmptyBlock(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  if (node.name !== "block" || Object.keys(node.attribs).length > 0) return;

  const diagnostic = new vscode.Diagnostic(
    findOpeningTagNameRange(textlines, startLine, node.name),
    "空的block标签",
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = EmptyBlockDiagnosticCode;
  diagnostics.push(diagnostic);
}
