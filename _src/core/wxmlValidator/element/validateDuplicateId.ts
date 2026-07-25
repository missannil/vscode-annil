import { type Domhandler, vscode } from "#deps";

/** 提取元素的逻辑 ID：静态值直接使用，动态 {{...}}_xxx 取最后一个 _ 后的 xxx。 */
function extractId(attribs: Record<string, string>): string | undefined {
  const rawId = attribs.id;
  if (rawId === undefined) return undefined;

  // 动态值：匹配 {{...}}_xxx 取最后 _ 后的部分
  const match = rawId.match(/\}\}_(.+)$/);
  if (match !== null) return match[1];

  // 静态值整体使用（跳过纯 {{}} 包裹的值如 {{xxx}}，无 _ 后缀无法提取）
  if (rawId.startsWith("{{")) return undefined;

  return rawId;
}

/**
 * 校验 WXML 中重复的 id 属性。
 *
 * id 重复规则：
 * 1. 静态 id="aaa" → 取 aaa
 * 2. 动态 id="{{fff}}_aaa" → 取最后一个 _ 后的 aaa
 * 3. annil disable 注释不屏蔽此检测
 */
export function validateDuplicateId(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  existingIds: Set<string>,
  diagnostics: vscode.Diagnostic[],
): void {
  const id = extractId(node.attribs);
  if (id === undefined) return;

  if (existingIds.has(id)) {
    const lineText = textlines[startLine] ?? "";
    const attrStart = lineText.indexOf(`id="`);
    const col = attrStart >= 0 ? attrStart + 4 : 0; // +4 跳过 id="

    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(startLine, col, startLine, col + id.length),
        "重复的id",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  } else {
    existingIds.add(id);
  }
}
