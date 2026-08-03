import { vscode } from "#deps";

/**
 * 在 textlines 中从 startLine 开始查找匹配正则的行，生成 Diagnostic
 *
 * @param regExpList - 匹配错误位置的正则列表
 * @param errorMessage - 诊断消息
 * @param textlines - 源码行数组
 * @param startLine - 起始行号
 * @param info - 附加信息（存入自定义字段）
 * @param code - 稳定诊断代码
 */
export function generateDiagnostic(
  regExpList: RegExp[],
  errorMessage: string,
  textlines: string[],
  startLine: number,
  info: Record<string, unknown> = {},
  code?: string,
): vscode.Diagnostic {
  for (let line = startLine; line < textlines.length; line++) {
    const lineText = textlines[line];
    for (const regExp of regExpList) {
      const match = lineText.match(regExp);
      if (match?.index != null) {
        const startChar = match.index;
        const endChar = startChar + match[0].length;
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(line, startChar, line, endChar),
          errorMessage,
          vscode.DiagnosticSeverity.Error,
        );
        diagnostic.source = "vscode-annil";
        if (code !== undefined) diagnostic.code = code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (diagnostic as any).info = info;

        return diagnostic;
      }
    }
  }

  // 回退：返回第一行的默认范围
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(0, 0, 0, 5),
    errorMessage,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  if (code !== undefined) diagnostic.code = code;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = info;

  return diagnostic;
}
