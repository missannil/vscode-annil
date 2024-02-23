import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";

// wxml中元素信息
export type ElementInfo = {
  by: "id";
  element: Domhandler.Element;
} | {
  by: "tag";
  element: Domhandler.Element[];
} | null;

/**
 * 获取wxml中对应子组件名称的元素信息
 * @param wxmlText wxml文本
 * @param tagNameOrId 子组件名称
 * @returns wxml的元素信息
 */
export function getElementList(
  wxmlDom: Domhandler.Document,
  tagNameOrId: string,
): Domhandler.Element[] {
  const domUtils = htmlparser2.DomUtils;
  const elementById = domUtils.getElementById(tagNameOrId, wxmlDom);
  if (elementById) return [elementById];
  const elementsByTagName = domUtils.getElementsByTagName(tagNameOrId, wxmlDom);
  if (elementsByTagName.length === 0) return [];

  return elementsByTagName;
}
