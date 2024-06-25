import { type ChildNode, Element, Text } from "domhandler";

class NodeType {
  public isElement(childNode: ChildNode): childNode is Element {
    return childNode.type === "tag";
  }
  public isCustomTag(childNode: ChildNode, subComponentNameList: string[]): boolean {
    return this.isElement(childNode)
      && (subComponentNameList.includes(childNode.name) || subComponentNameList.includes(childNode.attribs.id));
  }
  public isNativeTag(childNode: ChildNode, subComponentNameListL: string[]): boolean {
    return this.isElement(childNode) && !subComponentNameListL.includes(childNode.name)
      && !subComponentNameListL.includes(childNode.attribs.id);
  }
  public isTextNode(childNode: ChildNode): childNode is Text {
    return childNode.type === "text";
  }
}

export const nodeType = new NodeType();
