import { type Document, vscode } from "#deps";
import type { RootComponentInfo } from "../types/index.js";

/**
 * 校验 WXML 中使用的数据是否在 RootComponent 中定义
 *
 * 检查非自定义组件标签中的 { {xxx} } 表达式
 * 引用的数据名是否在 rootComponentInfo.dataList 中
 */
export function validateWxmlData(
  textlines: string[],
  wxmlDocument: Document,
  rootComponentInfo: RootComponentInfo,
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const validNames = new Set(rootComponentInfo.dataList);

  walkNodes(wxmlDocument.children, textlines, validNames, diagnostics);

  return diagnostics;
}

/** 递归遍历 DOM 节点 */
function walkNodes(
  nodes: unknown[],
  textlines: string[],
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  for (const node of nodes) {
    const el = node as {
      type?: string;
      name?: string;
      attribs?: Record<string, string>;
      data?: string;
      children?: unknown[];
    };

    if (el.type === "tag") {
      // 检查属性中的 mustache 表达式
      if (el.attribs) {
        for (const value of Object.values(el.attribs)) {
          const matches = value.matchAll(/\{\{(.+?)\}\}/g);
          for (const match of matches) {
            checkVariable(match[1].trim(), validNames, diagnostics);
          }
        }
      }

      if (el.children) walkNodes(el.children, textlines, validNames, diagnostics);
    }

    // 文本节点中的 mustache
    if (el.data !== undefined) {
      const text = el.data;
      const matches = text.matchAll(/\{\{(.+?)\}\}/g);
      for (const match of matches) {
        checkVariable(match[1].trim(), validNames, diagnostics);
      }
    }
  }
}

/** 检查单个变量是否合法 */
function checkVariable(
  expr: string,
  validNames: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  // 跳过内置变量、运算符表达式
  if (expr === "item" || expr === "index" || expr.startsWith("...")) return;
  if (expr.includes("(") || expr.includes("+") || expr.includes("?")) return;

  // 提取顶部变量名（支持 a.b.c 只检查 a）
  const topVar = expr.split(".")[0];

  if (!validNames.has(topVar)) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0), // 简化：先占位，后续精确到行
        `未定义的数据: "${topVar}"`,
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}
