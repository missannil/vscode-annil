import { type Domhandler, vscode } from "#deps";

export const UnknownTagDiagnosticCode = "annil.element.unknownTag";

/** 微信小程序 WXML 原生标签集合。 */
const nativeTagNames = new Set([
  "ad",
  "audio",
  "block",
  "button",
  "camera",
  "canvas",
  "checkbox",
  "checkbox-group",
  "cover-image",
  "cover-view",
  "editor",
  "form",
  "functional-page-navigator",
  "grid-item",
  "grid-view",
  "i",
  "icon",
  "image",
  "input",
  "label",
  "live-player",
  "live-pusher",
  "map",
  "movable-area",
  "movable-view",
  "navigation-bar",
  "navigator",
  "official-account",
  "open-data",
  "page-meta",
  "picker",
  "picker-view",
  "picker-view-column",
  "progress",
  "radio",
  "radio-group",
  "rich-text",
  "scroll-view",
  "slider",
  "slot",
  "swiper",
  "swiper-item",
  "switch",
  "text",
  "textarea",
  "video",
  "view",
  "web-view",
]);

/** 判断标签是否为微信小程序 WXML 原生标签。 */
export function isNativeTag(name: string): boolean {
  return nativeTagNames.has(name);
}

/** 为未注册的组件标签添加诊断（红色 Error）。 */
export function validateUnknownTag(
  node: Domhandler.Element,
  startLine: number,
  textlines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  // 在真实源码行中定位标签名的起始列，如 <unknownTag 中的 unknownTag
  const lineText = textlines[startLine] ?? "";
  const tagStart = lineText.indexOf("<" + node.name);
  const col = tagStart >= 0 ? tagStart + 1 : 0; // +1 跳过 <

  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(startLine, col, startLine, col + node.name.length),
    "未知标签",
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = UnknownTagDiagnosticCode;
  diagnostics.push(diagnostic);
}
