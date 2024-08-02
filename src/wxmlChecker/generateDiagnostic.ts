import * as vscode from "vscode";
import { assertNonNullable } from "../utils/assertNonNullable";

export function generateDiagnostic(
  // 找到错误位置的正则表达式
  regExpList: RegExp[],
  message: string,
  textlines: string[],
  elementStartLine: number,
  fixCode?: string,
): vscode.Diagnostic {
  for (let startLine = elementStartLine; startLine < textlines.length; startLine++) {
    const line = textlines[startLine];
    for (const regExp of regExpList) {
      const errorValueMatch = line.match(regExp);
      if (errorValueMatch) {
        const startCharacter = assertNonNullable(errorValueMatch.index);
        const endCharacter = startCharacter + errorValueMatch[0].length;

        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(
            startLine,
            startCharacter,
            startLine,
            endCharacter,
          ),
          message,
          vscode.DiagnosticSeverity.Error,
        );
        // ******通过code字段把正确的值带过去****** */
        diagnostic.code = fixCode;

        return diagnostic;
      }
      continue;
    }
  }

  throw new Error(`${regExpList}匹配不到错误`);
}
