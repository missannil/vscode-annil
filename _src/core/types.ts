export type TsFileFsPath = string;

export type VariableName = string;

export type ComponentTypeName = string;

export type CustomComponentMap = Record<VariableName, ComponentTypeName>;

type ImportName = string;
type ImportPath = string;

export type ImportedSubComponentPaths = Record<ImportName, ImportPath>;

// 组件的子文件信息
export type SubFileInfo = {
  componentInfo: SubComponentInfo | null;
  importTypeInfo: ImportedSubComponentPaths;
};

export const CUSTOM = "自定义";

export type Custom = { type: "Custom"; value: typeof CUSTOM };

export type Root = { type: "Root"; value: string };

export type Union = { type: "Union"; values: string[] };

export type Inherit = Custom | Root | Union;

// events字段的值
export type Events = { type: "Events"; value: string };

// 自身数据 例如 { data, computed, store的属性值 }
export type Self = { type: "Self"; value: string };

export type AttrValue = Inherit | Events | Self;

export type CustomComponentInfo = {
  line: number;
  fsPath: string;
  componentTypeName: string;
  configInfo: CustomComponentConfigInfo;
};

export type CustomComponentInfoWithoutFsPath = Omit<CustomComponentInfo, "fsPath">;

export type CustomComponentConfigInfo = Record<string, AttrValue>;
type SubCompName = string;

export type CustomComponentInfos = Record<SubCompName, CustomComponentInfo | undefined>;

type ChunkComponentConfigInfo = {
  arrTypeDatas: string[];
  boolTypeDatas: string[];
  dataList: string[];
  events: string[];
};

export type ChunkComponentInfo = {
  line: number;
  fsPath: string;
  configInfo: ChunkComponentConfigInfo;
};

export type ChunkComponentInfoWithoutFsPath = Omit<ChunkComponentInfo, "fsPath">;

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
  componentTypeName: string;
  info: CustomComponentInfo;
  line?: number;
} | {
  type: "chunk";
  info: ChunkComponentInfo;
  line?: number;
};

// ts文件信息
export type TsFileInfo = {
  rootComponentInfo: RootComponentInfo;
  customComponentInfos: CustomComponentInfos;
  chunkComponentInfos: ChunkComponentInfos;
  // 记录组件导入的子组件信息 为了验证组件json文件的合法性，例如 {"h_image":"./$Image","button":"@components/$button"}
  importedSubCompInfo: ImportedSubComponentPaths;
};

export type FileInfo = [string, string];
