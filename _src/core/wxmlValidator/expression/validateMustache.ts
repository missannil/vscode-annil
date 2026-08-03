import { vscode } from "#deps";
import { ExpressionDiagnosticCode } from "./diagnosticCodes.js";
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
  validNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
  sourceStart: vscode.Position,
): void {
  for (const match of text.matchAll(MUSTACHE_RE)) {
    const expr = match[1].trim();

    // 跳过内置变量与展开运算符
    if (expr === "item" || expr === "index" || expr.startsWith("...")) continue;

    // ① 非法运算符检测 — 最高优先级
    const illegalOp = findIllegalOperator(expr);
    if (illegalOp !== null) {
      const mustacheStart = getPositionAtMatch(sourceStart, text, match.index ?? 0);
      diagnostics.push(
        createDiagnostic(
          new vscode.Range(
            mustacheStart,
            getPositionAtMatch(sourceStart, text, (match.index ?? 0) + match[0].length),
          ),
          `非法的运算符: "${illegalOp}"`,
          ExpressionDiagnosticCode.illegalOperator,
        ),
      );
      continue;
    }

    // 复杂表达式暂跳过变量校验
    if (expr.includes("(") || expr.includes("+") || expr.includes("?")) continue;

    // ② 变量名语法校验
    const memberStart = expr.search(/[.\[]/);
    const topVar = memberStart >= 0 ? expr.slice(0, memberStart) : expr;
    if (!isValidVariableName(topVar)) {
      const matchStart = match.index ?? 0;
      const variableOffset = matchStart + Math.max(match[0].indexOf(topVar), 0);
      diagnostics.push(
        createDiagnostic(
          new vscode.Range(
            getPositionAtMatch(sourceStart, text, variableOffset),
            getPositionAtMatch(sourceStart, text, variableOffset + topVar.length),
          ),
          `无效的变量: "${topVar}"`,
          ExpressionDiagnosticCode.invalidVariable,
        ),
      );
      continue;
    }

    // ③ 数据名校验
    if (validNames.has(topVar)) continue;

    const matchStart = match.index ?? 0;
    const variableOffset = matchStart + Math.max(match[0].indexOf(topVar), 0);
    diagnostics.push(
      createDiagnostic(
        new vscode.Range(
          getPositionAtMatch(sourceStart, text, variableOffset),
          getPositionAtMatch(sourceStart, text, variableOffset + topVar.length),
        ),
        `未知数据: "${topVar}"`,
        ExpressionDiagnosticCode.unknownData,
      ),
    );
  }
}

/** 在校验一批属性值时调用，逐个扫描其中的 mustache 表达式。 */
export function validateAttributeValues(
  attributes: Array<[string, string]>,
  validNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
  getAttributeValueStart: (name: string, value: string) => vscode.Position,
): void {
  for (const [name, value] of attributes) {
    validateMustacheText(value, validNames, diagnostics, getAttributeValueStart(name, value));
  }
}

/** 将当前节点内相对偏移转换为 WXML 文档位置。 */
function getPositionAtMatch(sourceStart: vscode.Position, text: string, offset: number): vscode.Position {
  let line = sourceStart.line;
  let character = sourceStart.character;

  for (let index = 0; index < offset; index++) {
    if (text[index] === "\n") {
      line++;
      character = 0;
    } else {
      character++;
    }
  }

  return new vscode.Position(line, character);
}

function createDiagnostic(range: vscode.Range, message: string, code: string): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
  diagnostic.source = "vscode-annil";
  diagnostic.code = code;

  return diagnostic;
}
