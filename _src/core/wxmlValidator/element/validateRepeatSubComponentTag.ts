import { type Domhandler, vscode } from "#deps";

export const RepeatSubComponentDiagnosticCode = "annil.customComponent.repeatedTag";

/**
 * 校验自定义组件标签是否重复出现。
 *
 * `annil disable repeatTag` 仅跳过紧随元素的重复诊断；该元素仍会被记录，
 * 因此后续元素会继续参与重复标签检查。
 */
export function validateRepeatSubComponentTag(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  checkedTags: Set<string>,
  allowRepeatTag: boolean,
  diagnostics: vscode.Diagnostic[],
): void {
  const tagName = node.name;
  if (!allowRepeatTag && checkedTags.has(tagName)) {
    const lineText = textlines[startLine] ?? "";
    const tagStart = lineText.indexOf(`<${tagName}`);
    const startCharacter = tagStart < 0 ? 0 : tagStart + 1;
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(startLine, startCharacter, startLine, startCharacter + tagName.length),
      "重复的子组件",
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = "vscode-annil";
    diagnostic.code = RepeatSubComponentDiagnosticCode;
    diagnostics.push(diagnostic);
  }

  checkedTags.add(tagName);
}
