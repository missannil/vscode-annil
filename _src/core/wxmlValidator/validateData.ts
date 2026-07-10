import { type Domhandler, vscode } from "#deps";

/**
 * 校验 WXML 中使用的数据是否在合法数据集合中
 *
 * 检查标签和文本中的 {{xxx}} 表达式引用的数据名是否在 validNames 中。
 * validNames 由调用方提前合并（rootComponent + subComponents + config.validDatas）。
 */
export function validateWxmlData(
  textlines: string[],
  wxmlDocument: Domhandler.Document,
  validNames: Set<string>,
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  walkNodes(wxmlDocument.children, textlines, validNames, diagnostics);

  return diagnostics;
}

// ---- 内联类型 ----

interface DomNode {
  type?: string;
  name?: string;
  attribs?: Record<string, string>;
  data?: string;
  children?: DomNode[];
}

const MUSTACHE_RE = /\{\{(.+?)\}\}/g;

// ---- DOM 遍历 ----

/** 递归遍历 DOM 节点，检查所有 mustache 引用 */
function walkNodes(
  nodes: unknown[],
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const node of nodes) {
    const el = node as DomNode;

    if (el.type === "tag") {
      // 检查属性中的 mustache 表达式
      if (el.attribs) {
        for (const value of Object.values(el.attribs)) {
          checkMustacheMatches(value, textlines, validNames, diagnostics);
        }
      }

      if (el.children) {
        walkNodes(el.children, textlines, validNames, diagnostics);
      }
    }

    // 文本节点中的 mustache
    if (el.data !== undefined) {
      checkMustacheMatches(el.data, textlines, validNames, diagnostics);
    }
  }
}

// ---- mustache 匹配 ----

/** 扫描文本中的 {{...}}，逐个校验 */
function checkMustacheMatches(
  text: string,
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const match of text.matchAll(MUSTACHE_RE)) {
    const expr = match[1].trim();

    // 跳过内置变量
    if (expr === "item" || expr === "index" || expr.startsWith("...")) continue;
    // 跳过运算符表达式（包含 ( + ? 说明是运算而非简单变量引用）
    if (expr.includes("(") || expr.includes("+") || expr.includes("?")) continue;

    // 提取顶部变量名（a.b.c → a）
    const topVar = expr.split(".")[0];

    if (validNames.has(topVar)) continue;

    // 在源码行中定位该 mustache 出现的位置
    const { line, col } = findMustachePosition(match, textlines);

    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(line, col, line, col + match[0].length),
        `未知数据: "${topVar}"`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}

// ---- 位置计算 ----

/**
 * 在源码行数组中定位指定 mustache 的位置
 *
 * 逐行扫描：找到包含完整 mustache 字符串（如 "{{expr}}"）的行
 */
function findMustachePosition(
  match: RegExpMatchArray,
  textlines: string[],
): { line: number; col: number } {
  const needle = match[0];

  for (let i = 0; i < textlines.length; i++) {
    const col = textlines[i].indexOf(needle);
    if (col >= 0) {
      return { line: i, col };
    }
  }

  return { line: 0, col: 0 };
}
