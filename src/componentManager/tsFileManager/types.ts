import type { TsUri } from "../uriHelper";

export type TsFileFsPath = string;

export type VariableName = string;

export type ComponentTypeName = string;

export type CustomComponentMap = Record<VariableName, ComponentTypeName>;
type AttrName = string;

type ImportName = string;
type ImportPath = string;

export type ImportTypeInfo = Record<ImportName, ImportPath | undefined>;

// 组件的子文件信息
export type SubFileInfo = {
  componentInfo: SubComponentInfo | null;
  importTypeInfo: ImportTypeInfo;
};

export const CUSTOM = "自定义";

// export type Ternary = { type: "Ternary"; value: string[] };
export type Custom = { type: "Custom"; value: typeof CUSTOM };

export type Root = { type: "Root"; value: string };

export type Union = { type: "Union"; values: string[] };

// export type InheritValue = WxFor | Ternary | Custom | RootData;
export type Inherit = Custom | Root | Union;

// events字段的值
export type Events = { type: "Events"; value: string };

// 自身数据 例如 { data, computed, store的属性值 }
export type Self = { type: "Self"; value: string };

export type AttrValue = Inherit | Events | Self;

export type CustomComponentInfo = Record<AttrName, AttrValue>;
type SubCompName = string;

export type CustomComponentInfos = Record<SubCompName, CustomComponentInfo | undefined>;

export type ChunkComponentInfo = {
  arrTypeDatas: string[];
  boolTypeDatas: string[];
  dataList: string[];
  events: string[];
};

export type ChunkComponentInfos = Record<SubCompName, ChunkComponentInfo | undefined>;

// arrTypeData: 数组类型的数据 为了判断wxml中wxfor中变量的类型
// dataList: 所有的数据类型
// events: 所有的事件类型
export type RootComponentInfo = {
  arrTypeDatas: string[];
  boolTypeDatas: string[];
  dataList: string[];
  events: string[];
  customEvents: string[];
};

export type SubComponentInfo = {
  type: "custom";
  componentTypeName: string; // $Image
  info: CustomComponentInfo;
} | {
  type: "chunk";
  info: ChunkComponentInfo;
};

export type TsFileInfo = {
  customComponentInfos: CustomComponentInfos;
  rootComponentInfo: RootComponentInfo;
  chunkComopnentInfos: ChunkComponentInfos;
  importedSubCompInfo: ImportTypeInfo;
};

export type ChangedTsFileInfo = { type: "main"; text?: string } | { type: "related"; text: string; uri: TsUri };
