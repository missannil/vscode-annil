import { type Domhandler, vscode } from "#deps";

import { WxmlValidationContext } from "./context.js";
import { walkWxmlNodeList } from "./walkNodeList.js";

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
  // 1. 构造验证上下文，把诊断收集和遍历状态集中管理。
  const context = new WxmlValidationContext(textlines);

  // 2. 复用通用节点遍历框架，只在 hooks 中补充当前这类校验。
  walkWxmlNodeList(wxmlDocument.children, context, {
    onElementNode(node, _, currentContext) {
      for (const value of Object.values(node.attribs)) {
        checkMustacheMatches(value, currentContext.textlines, validNames, currentContext.diagnosticList);
      }
    },
    onTextNode(node, _, currentContext) {
      checkMustacheMatches(node.data, currentContext.textlines, validNames, currentContext.diagnosticList);
    },
  });

  // 3. 统一返回收集到的诊断结果。
  return context.diagnosticList;
}

const MUSTACHE_RE = /\{\{(.+?)\}\}/g;

// ---- mustache 匹配 ----

/** 扫描文本中的 {{...}}，逐个校验 */
function checkMustacheMatches(
  text: string,
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  // 1. 依次扫描文本中的所有 {{...}} 片段。
  for (const match of text.matchAll(MUSTACHE_RE)) {
    // 2. 提取 mustache 内部表达式并去掉首尾空白。
    const expr = match[1].trim();

    // 3. 跳过循环变量和展开语法，这些不是普通数据引用。
    if (expr === "item" || expr === "index" || expr.startsWith("...")) continue;
    // 4. 跳过带运算符的表达式，只处理简单变量引用。
    if (expr.includes("(") || expr.includes("+") || expr.includes("?")) continue;

    // 5. 提取顶部变量名（例如 a.b.c 只取 a）。
    const topVar = expr.split(".")[0];

    // 6. 如果变量名合法，直接跳过。
    if (validNames.has(topVar)) continue;

    // 7. 定位错误 mustache 在源码中的具体位置。
    const { line, col } = findMustachePosition(match, textlines);

    // 8. 生成未知数据诊断并加入结果集。
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
  // 1. 记录本次匹配的完整文本。
  const needle = match[0];

  // 2. 从上到下逐行查找 mustache 第一次出现的位置。
  for (let i = 0; i < textlines.length; i++) {
    const col = textlines[i].indexOf(needle);
    if (col >= 0) {
      // 3. 找到后直接返回行列号。
      return { line: i, col };
    }
  }

  // 4. 找不到时回退到默认位置，保证调用方始终有可用范围。
  return { line: 0, col: 0 };
}
