import { type Domhandler, vscode } from "#deps";

export const DuplicateIdDiagnosticCode = "annil.element.duplicateId";

/**
 * 提取元素的比对 ID：按 _ 分割后取最后一段（不经规范化）。
 * 用于在 rawId 中定位 column —— 必须是原文中的真实子串。
 *
 * 例如：
 * - "aaa"                → "aaa"
 * - "{{fff}}_aaa"        → "aaa"
 * - "{{ index }}_bbb"    → "bbb"
 * - "{{ index }}"        → "{{ index }}"（不含 _ 时整段）
 */
function extractComparableId(rawId: string): string {
  return rawId.trim().split("_").slice(-1)[0];
}

/**
 * 规范化 mustache 内部空格，使 {{ index }} 与 {{index}} 视为相同 id。
 * 不影响静态值（如 "aaa"）和非 mustache 部分。
 */
function normalizeMustache(id: string): string {
  return id.replace(/\{\{\s*(.+?)\s*\}\}/g, "{{$1}}");
}

/** mustache 内部变量匹配：捕获组 1 = 变量名，index = 在原文中的起始位置 */
const MUSTACHE_INNER_RE = /\{\{\s*(.+?)\s*\}\}/g;

/**
 * 获取 comparableId 中诊断应标注的范围（偏移量 + 长度）。
 * 若有 mustache，只标注内部变量名；否则标注整个 comparableId。
 */
function getDiagnosticRangeInComparableId(
  rawComparableId: string,
): { offset: number; length: number } {
  MUSTACHE_INNER_RE.lastIndex = 0;
  const m = MUSTACHE_INNER_RE.exec(rawComparableId);
  if (m) {
    // 只标 mustache 内部的变量名，如 {{ index }} → offset 3, length 5
    return { offset: m.index + m[0].indexOf(m[1]), length: m[1].length };
  }

  return { offset: 0, length: rawComparableId.length };
}

/**
 * 校验 WXML 中重复的 id。
 *
 * 规则：每个元素取 id 属性按 _ 分割后的最后一段，规范化 mustache 内部空格后全局不可重复。
 *
 * 为什么取最后一段：miniTest 框架渲染组件时会在 id 前面加上前缀，
 * 所以约定获取组件时使用 `[id$="xxx"]` 选择器（即后缀匹配）。
 * 因此比对时需要按 `_` 分割取最后一段来判断是否重复。
 *
 * annil disable 注释不屏蔽此检测。
 */
export function validateDuplicateId(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  existingIds: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  const rawId = node.attribs.id;
  if (rawId === undefined) return;

  const rawComparableId = extractComparableId(rawId);
  const comparableId = normalizeMustache(rawComparableId);

  if (existingIds.has(comparableId)) {
    const lineText = textlines[startLine] ?? "";
    const attrStart = lineText.indexOf(`id="`);
    if (attrStart < 0) return;

    // rawComparableId 在 rawId 中的起始偏移
    const suffixStartInValue = rawId.lastIndexOf(rawComparableId);
    // 在 comparableId 内部进一步缩窄到 mustache 变量名
    const { offset: innerOffset, length: innerLen } = getDiagnosticRangeInComparableId(rawComparableId);
    const col = attrStart + 4 + suffixStartInValue + innerOffset; // +4 跳过 id="

    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(startLine, col, startLine, col + innerLen),
      "重复的id",
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = "vscode-annil";
    diagnostic.code = DuplicateIdDiagnosticCode;
    diagnostics.push(diagnostic);
  } else {
    existingIds.add(comparableId);
  }
}
