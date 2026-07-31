import { vscode } from "#deps";
import { findIllegalOperator } from "./validateIllegalOperator.js";
import { isValidVariableName } from "./validateVariableSyntax.js";

/** 匹配 `{{expr}}` 语法的正则。 */
const MUSTACHE_RE = /\{\{(.+?)\}\}/g;

/**
 * 扫描文本中的 `{{...}}`，按三层级联校验：
 *   ① 非法运算符 → Error
 *   ② 变量名语法 → Error
 *   ③ 数据名是否在合法集合中 → Error（"未知数据"）
 *
 * 调用方只需传入当前作用域下的有效变量名集合即可。
 */
// eslint-disable-next-line complexity -- 非法运算符→变量语法→数据名 三层级联
export function validateMustacheText(
  text: string,
  textlines: string[],
  validNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const match of text.matchAll(MUSTACHE_RE)) {
    const expr = match[1].trim();

    // 跳过内置变量与展开运算符
    if (expr === "item" || expr === "index" || expr.startsWith("...")) continue;

    // ① 非法运算符检测 — 最高优先级
    const illegalOp = findIllegalOperator(expr);
    if (illegalOp !== null) {
      const { line, col } = findMustachePosition(match, textlines);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(line, col, line, col + match[0].length),
          `非法的运算符: "${illegalOp}"`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
      continue;
    }

    // 复杂表达式暂跳过变量校验
    if (expr.includes("(") || expr.includes("+") || expr.includes("?")) continue;

    // ② 变量名语法校验
    const topVar = expr.split(".")[0];
    if (!isValidVariableName(topVar)) {
      const { line, col } = findMustachePosition(match, textlines);
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(line, col, line, col + match[0].length),
          `无效的变量: "${topVar}"`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
      continue;
    }

    // ③ 数据名校验
    if (validNames.has(topVar)) continue;

    const { line, col } = findMustachePosition(match, textlines);
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(line, col, line, col + match[0].length),
        `未知数据: "${topVar}"`,
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }
}

/** 在校验一批属性值时调用，逐个扫描其中的 mustache 表达式。 */
export function validateAttributeValues(
  attributes: Array<[string, string]>,
  textlines: string[],
  validNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const [, value] of attributes) {
    validateMustacheText(value, textlines, validNames, diagnostics);
  }
}

/** 在源码行数组中定位指定 mustache 的位置。 */
function findMustachePosition(
  match: RegExpMatchArray,
  textlines: string[],
): { line: number; col: number } {
  const needle = match[0];

  for (let i = 0; i < textlines.length; i++) {
    const col = textlines[i].indexOf(needle);
    if (col >= 0) return { line: i, col };
  }

  return { line: 0, col: 0 };
}
