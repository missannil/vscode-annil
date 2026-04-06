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
  // 最外层的block标签要被忽略(约定这个block是控制wxml渲染的，不参与验证)，所以需要一个参数来标记最外层的block标签是否已经被忽略了。首次调用时isRootBlock为true, 之后递归调用时为false。
  isRootBlock: boolean;
  isRootElement: boolean;
  // scopeType需要在递归过程中传递和更新,因为子元素可能处于条件block或循环block内。
  scopeType: ScopeType[];
  tagInfoList: TagInfo[];
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

export type ComponentName = string & { __brand: "componentName" };

export type FileText = string & { __brand: "fileText" };

export type Attrib = string & { __brand: "attrib" };

// 记录获取组件信息的方法和参数, string为字段信息, [string,string]中第一个是方法名,第二个是参数字符串
export type MethodsRecord = Record<string, [string, string]>;
