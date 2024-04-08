import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";

/**
 * 获取wxml中对应子组件名称的元素信息
 * @param wxmlText wxml文本
 * @param tagNameOrId 子组件名称
 * @returns wxml的元素信息
 */
export function getElementList(
  wxmlDom: Domhandler.Document,
  tagNameOrId: string,
): Domhandler.Element | Domhandler.Element[] | null {
  const domUtils = htmlparser2.DomUtils;
  const elementById = domUtils.getElementById(tagNameOrId, wxmlDom.children);
  if (elementById) return elementById;
  const elementsByTagName = domUtils.getElementsByTagName(tagNameOrId, wxmlDom);
  if (elementsByTagName.length === 0) return null;

  return elementsByTagName;
}
