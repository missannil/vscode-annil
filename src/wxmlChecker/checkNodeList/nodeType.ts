import { type ChildNode, type Comment, type Element, type Text } from "domhandler";
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
  /**
   * 判断是否是自定义组件
   * 1. 标签名不在原生组件列表中
   * 2. 标签id值在子组件列表中 且id值以标签名开头
   * 3. 标签名在子组件列表中
   */
  public isCustomTag(childNode: Element, customComponentNameList: readonly string[]): childNode is Element {
    if (!this.isElement(childNode)) return false;

    return customComponentNameList.includes(childNode.name);
  }
  public isNativeTag(childNode: Element): boolean {
    return nativeComponentList.includes(childNode.name);
  }
  public isTextNode(childNode: ChildNode): childNode is Text {
    return childNode.type === "text";
  }
  public isCommentNode(childNode: ChildNode): childNode is Comment {
    return childNode.type === "comment";
  }

  public isBlockTag(element: Element): boolean {
    return element.tagName === "block";
  }
  public isChunkTag(element: Element, chunkIds: string[]): boolean {
    return chunkIds.includes(element.attribs.id);
  }
}

export const nodeType = new NodeType();
