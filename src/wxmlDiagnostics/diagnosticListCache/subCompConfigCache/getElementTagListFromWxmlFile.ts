import type * as Domhandler from "domhandler";
import { nativeComponentList } from "./nativeComponentList";

function isElement(document: Domhandler.Node): document is Domhandler.Element {
  return document.type === "tag";
}

// 收集wxml文件中的自定义标签
function collectCustomTags(childNodeList: Domhandler.ChildNode[], customTagsList: string[] = []): string[] {
  Array.from(childNodeList).forEach(childNode => {
    if (isElement(childNode)) {
      customTagsList.push(childNode.name);

      collectCustomTags(childNode.children, customTagsList);
    }
  });

  return customTagsList;
}

function removeNativeComponent(customTagsList: string[]): string[] {
  return customTagsList.filter(tagName => !nativeComponentList.includes(tagName));
}

function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function getElementTagListFromWxmlFile(wxmlDocument: Domhandler.Document): string[] {
  const customTagsList = collectCustomTags(wxmlDocument.children);

  return uniqueArray(removeNativeComponent(customTagsList));
}
