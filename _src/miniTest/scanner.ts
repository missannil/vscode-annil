import { parseDocument } from "#deps";
import type * as Domhandler from "domhandler";
import { nativeComponents } from "./nativeComponents.js";
import type { ScopeType, TagInfo } from "./types.js";

const defaultAttributes = new Set(["class", "style"]);
const events = ["bind:tap", "catch:tap"];

function hasText(node: Domhandler.Element): boolean {
  const children = node.children.filter(child => child.type !== "comment");

  return children.length > 0 && children.every(child => child.type === "text")
    && children.some(child => child.type === "text" && child.data.trim() !== "");
}

function isConditional(node: Domhandler.Element): boolean {
  return ["wx:if", "wx:elif", "wx:else"].some(key => key in node.attribs);
}

function shouldKeep(node: Domhandler.Element, attributes: readonly string[]): boolean {
  if (!node.attribs.id) return false;

  return Object.keys(node.attribs).some(attribute =>
    defaultAttributes.has(attribute) || attributes.includes(attribute) || attribute.startsWith("data-")
    || events.some(event => attribute.startsWith(event))
  ) || hasText(node);
}

function walk(
  nodes: readonly Domhandler.ChildNode[],
  scope: readonly ScopeType[],
  result: TagInfo[],
  root: { value: boolean },
  attributes: readonly string[],
): void {
  for (const child of nodes) {
    if (child.type !== "tag") continue;
    const node = child as Domhandler.Element;
    if (node.tagName === "block") {
      const nextScope = [...scope];
      if (isConditional(node)) nextScope.push("wxIf");
      if ("wx:for" in node.attribs) nextScope.push("wxFor");
      walk(node.children, nextScope, result, root, attributes);
      continue;
    }
    const isCustom = !nativeComponents.has(node.tagName);
    if (isCustom || shouldKeep(node, attributes)) {
      result.push({ element: node, isRoot: root.value, scope: [...scope], isCustom, hasInnerText: hasText(node) });
      root.value = false;
    }

    walk(node.children, scope, result, root, attributes);
  }
}

export function scanWxml(text: string, generatedAttributes: readonly string[]): TagInfo[] {
  const document = parseDocument(text, { xmlMode: true });
  const result: TagInfo[] = [];

  walk(document.childNodes, [], result, { value: true }, generatedAttributes);

  return result;
}
