import type * as Domhandler from "domhandler";

export type TagInfo = {
  // 是否为根组件
  isRoot: boolean;
  // 元素所在的block类型, scopeType可能包含两个, 例如一个元素可能同时处于条件block和循环block内, 那么scopeType就是["wxIf", "wxFor"]
  scopeType: ScopeType[];
  element: Domhandler.Element;
  hasInnerText: boolean;
  isCustomTag: boolean;
};

export type ScopeType = "wxIf" | "wxFor";

export type ShouldValidateListParams = {
  childNodes: Domhandler.ChildNode[];
  // isRootBlock和isRootElement的区别: 只有最外层的第一个条件block标签会被认为是isRootBlock,且这个标签不会生成TagInfo; 第一个元素节点(isRootElement)是非RootBlock后的第一个元素节点,它在生成TagInfo时被当做根节点区别于后面的节点,所以isRootElement只会有一个true,之后的都是false
  isRootBlock: boolean;
  isRootElement: boolean;
  // scopeType需要在递归过程中传递和更新,因为子元素可能处于条件block或循环block内。
  scopeType: ScopeType[];
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

// 记录获取组件信息的方法和参数, string为字段信息, [string,string]中第一个是方法名,第二个是参数字符串
export type MethodsRecord = Record<string, [string, string]>;
