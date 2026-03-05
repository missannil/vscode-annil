import type * as Domhandler from "domhandler";

export type TagInfo = {
  isRoot: boolean;
  blockType: BlockType[];
  element: Domhandler.Element;
};

export type BlockType = "wxIf" | "wxFor";

export type ShouldValidateListParams = {
  childNodes: Domhandler.ChildNode[];
  // isRootBlock和isRootElement的区别: 只有最外层的第一个条件block标签会被认为是isRootBlock,且这个标签不会生成TagInfo; 第一个元素节点(isRootElement)是非RootBlock后的第一个元素节点,它在生成TagInfo时被当做根节点区别于后面的节点,所以isRootElement只会有一个true,之后的都是false
  isRootBlock: boolean;
  isRootElement: boolean;
  // blockType需要在递归过程中传递和更新,因为子元素可能处于条件block或循环block内。
  blockType: BlockType[];
  result: TagInfo[];
};

type BaseContentType =
  | "importPart"
  | "customComponentInfo"
  | "partialCustomComponentInfo"
  | "componentInfo"
  | "partialComponentInfo"
  | "testClass";

export type BaseContent = Record<BaseContentType, string[]>;

export type FsPath = string & { __brand: "fsPath" };

export type FileName = string & { __brand: "fileName" };

export type FileText = string & { __brand: "fileText" };

export type Attrib = string & { __brand: "attrib" };
