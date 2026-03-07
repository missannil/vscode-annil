import * as Domhandler from "domhandler";
import { nativeComponents } from "./nativeComponents";
import type { Attrib } from "./types";

export const indent = "    ";

export function capitalize(s: string): string {
  if (!s) return s;

  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 把kebab-case(中划线命名)转换成camelCase
export function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}

export function isElement(document: Domhandler.Node): document is Domhandler.Element {
  return document.type === "tag";
}

export function isNativeTag(tagName: string): boolean {
  return nativeComponents.includes(tagName);
}

export function isCustomTag(tagName: string): boolean {
  return !isNativeTag(tagName) && tagName !== "block";
}

export function isBlockTag(tagName: string): boolean {
  return tagName === "block";
}

export function isConditional(element: Domhandler.Element): boolean {
  const attribs = ["wx:if", "wx:elif", "wx:else"];

  return attribs.some(attrib => element.attribs[attrib] !== undefined);
}

export function isLoop(element: Domhandler.Element): boolean {
  return element.attribs["wx:for"] !== undefined;
}

export function hasValidationMark(attribs: Record<string, string>): boolean {
  return attribs["id"] !== undefined;
}

export function hasInnerText(element: Domhandler.Element): boolean {
  const nonCommentChildren = element.children.filter(child => child.type !== "comment");
  if (nonCommentChildren.length === 0) return false;
  if (nonCommentChildren.some(child => child.type !== "text")) return false;

  return nonCommentChildren.some(child => (child as Domhandler.Text).data.trim() !== "");
}
const normalAttribs = ["class", "style"];
const dataPrefix = "data-";
const eventPrefix = ["bind:", "catch:"];

export function isNormalAttrib(attrib: Attrib): boolean {
  return normalAttribs.includes(attrib);
}

export function isDataAttrib(attrib: Attrib): boolean {
  return attrib.startsWith(dataPrefix);
}

export function isEventAttrib(attrib: Attrib): boolean {
  return eventPrefix.some(prefix => attrib.startsWith(prefix));
}

export function isValidAttrib(attrib: Attrib): boolean {
  return isNormalAttrib(attrib) || isDataAttrib(attrib) || isEventAttrib(attrib);
}

/**
 * 是否应该验证这个标签
 * @param element
 * @returns
 */
export function shouldValidateElement(element: Domhandler.Element): boolean {
  //  原生组件有标识 且（有验证属性 或 有innerText）才需要验证
  return hasValidationMark(element.attribs)
    && ((Object.keys(element.attribs) as Attrib[]).some(isValidAttrib) || hasInnerText(element));
}
