import { type Domhandler, vscode } from "#deps";
import type { ChunkComponentInfo, ChunkComponentInfoRecord, TsFileInfo } from "../../types/TsFileInfo.js";
import { findOpeningTagAttributeValueRange } from "../element/openingTag.js";
import { validateAttributeValues } from "../expression/validateMustache.js";

/**
 * 校验 ChunkComponent 元素（原生标签 + id 命中 chunkComponentInfoRecord）。
 *
 * Chunk 不是一种新标签类型，而是给原生元素附加局部数据/事件作用域。
 * 识别方式：`<view id="chunkA">` 中 `id` 匹配 TS 中 ChunkComponent 的变量名。
 *
 * 校验项：
 *   - 属性值中的 mustache 变量应在 chunk 自身 dataList + rootData 中
 *   - 事件绑定的值应在 chunk events 中
 *   - 不产生"缺少属性"/"未知属性"等契约诊断（chunk 没有属性白名单）
 */
export function validateChunkComponent(
  node: Domhandler.Element,
  startLine: number,
  chunkId: string,
  tsFileInfo: TsFileInfo,
  rootDataNames: ReadonlySet<string>,
  diagnostics: vscode.Diagnostic[],
  textlines: string[],
): void {
  const chunkInfo = tsFileInfo.chunkComponentInfoRecord[chunkId];
  if (chunkInfo === undefined) return;

  // chunk 属性值可在 chunk data + rootData 中
  const chunkValidNames = new Set([...rootDataNames, ...chunkInfo.dataList]);

  // 对非事件属性校验 mustache 变量
  const normalAttrs: Array<[string, string]> = [];
  for (const [name, value] of Object.entries(node.attribs)) {
    if (name === "id" || name.startsWith("wx:")) continue;

    if (isEventAttr(name)) {
      validateChunkEvent(name, value, chunkInfo, startLine, textlines, diagnostics);

      continue;
    }

    normalAttrs.push([name, value]);
  }

  validateAttributeValues(
    normalAttrs,
    chunkValidNames,
    diagnostics,
    (name, value) => findOpeningTagAttributeValueRange(textlines, startLine, name, value).start,
  );
}

/**
 * 从 chunkComponentInfoRecord 中查找命中 id 的 chunk。
 *
 * @returns chunkId 或 undefined
 */
export function resolveChunkId(
  node: Domhandler.Element,
  chunkRecord: ChunkComponentInfoRecord,
): string | undefined {
  const id = node.attribs.id;
  if (id === undefined || id === "") return undefined;

  return chunkRecord[id] !== undefined ? id : undefined;
}

function isEventAttr(name: string): boolean {
  return name.startsWith("bind:") || name.startsWith("catch:");
}

function validateChunkEvent(
  name: string,
  value: string,
  chunkInfo: ChunkComponentInfo,
  startLine: number,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  if (chunkInfo.events.includes(value)) return;

  const diagnostic = new vscode.Diagnostic(
    findOpeningTagAttributeValueRange(textlines, startLine, name, value),
    `事件 "${name}" 未在 ChunkComponent 中定义: "${value}"`,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = "annil.chunkEvent.unknown";
  diagnostics.push(diagnostic);
}
