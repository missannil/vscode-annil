import { type ChildNode, type Element, type Text } from "domhandler";
const nativeComponentList = [
  "view",
  "scroll-view",
  "swiper",
  "movable-view",
  "cover-view",
  "icon",
  "text",
  "block",
  "slot",
  "i",
  "rich-text",
  "progress",
  "button",
  "checkbox",
  "form",
  "input",
  "label",
  "picker",
  "picker-view",
  "radio",
  "slider",
  "switch",
  "textarea",
  "navigator",
  "audio",
  "camera",
  "image",
  "live-player",
  "video",
  "map",
  "canvas",
  "open-data",
  "web-view",
  "ad",
  "official-account",
  "editor",
  "swiper-item",
  "movable-area",
  "cover-image",
  "checkbox-group",
  "radio-group",
  "functional-page-navigator",
];
class NodeType {
  public isElement(childNode: ChildNode): childNode is Element {
    return childNode.type === "tag";
  }
  public isCustomTag(childNode: Element, subComponentNameList: string[]): boolean {
    return subComponentNameList.includes(childNode.attribs.id) || subComponentNameList.includes(childNode.name);
  }
  public isNativeTag(childNode: Element): boolean {
    return nativeComponentList.includes(childNode.name);
  }
  public isTextNode(childNode: ChildNode): childNode is Text {
    return childNode.type === "text";
  }
}

export const nodeType = new NodeType();
