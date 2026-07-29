/** ------------------- RootComponentInfo----------------*/

/**
 * 提供 RootComponent API 中定义的数据信息，用于校验 WXML 中非自定义组件用到的数据。
 */
export type RootComponentInfo = {
  /** 数组类型的数据列表，用于判断 wxml 中 wx:for 循环变量的类型 */
  arrTypeDatas: string[];
  /** 布尔类型的数据列表,用于判断 wxml 中 wx:if 条件变量的类型 */
  boolTypeDatas: string[];
  /** 所有数据列表 用于验证 wxml 绑定数据 */
  dataList: string[];
  /** 所有事件列表 用于验证事件属性 (bind:tap="xxx")值(xxx) */
  events: string[];
};

/** ------------------- AttrValue（属性值类型）----------------*/

/** "自定义" 常量，用于默认情况(缺失属性)时修复诊断错误(缺少属性)时使用的默认值 */
export const CUSTOM = "自定义";

/** 自定义值类型 — 表示属性值由 WXML 模板传入，无法在 TS 中静态推断 */
export type Custom = { type: "Custom"; value: typeof CUSTOM };

/** 根数据路径引用 — 表示属性值来自 RootComponent 的数据路径 */
export type Root = { type: "Root"; value: string };

/** 三元表达式类型 — 表示属性值为三元表达式，依赖多个数据源 */
export type Ternary = { type: "Ternary"; values: string[] };

/** 继承类型 — 表示子组件属性可接受的值的来源：自定义传入 | 根数据路径 | 三元表达式 */
export type Inherit = Custom | Root | Ternary;

/** 事件类型 — 表示属性值是一个事件绑定 */
export type Events = { type: "Events"; value: string };

/** 自身数据类型 — 表示属性值来自组件自身的数据字段（data/computed/store） */
export type Self = { type: "Self"; value: string };

/** 属性值联合类型 — 所有可能的属性值来源 */
export type AttrValue = Inherit | Events | Self;

/** ------------------- CustomComponentInfo----------------*/

/** 子组件变量名 */
type ComponentName = string;

/**
 * 子组件配置信息（统一类型）
 *
 * configInfo: 属性值映射，用于校验 WXML 属性绑定。
 * - inherit 字段 → Root / Ternary / Custom
 * - data/computed/store 字段 → Self
 * - events 字段 → Events
 */
export type CustomComponentInfo = {
  /** 声明所在行号 */
  line: number;
  /** 文件路径（子组件可能定义在不同文件） */
  fsPath?: string;
  /** 组件类型名（泛型参数），如 $Image，仅 typed subcomponent 有此值 */
  componentTypeName?: string;
  /**
   * 属性配置映射
   * - inherit 字段 → AttrValue（Root / Ternary / Custom）
   * - data/computed/store 字段 → Self
   * - events 字段 → Events
   */
  configInfo: Record<string, AttrValue>;
  /** 数组类型的数据名列表（来自 data/computed/store） */
  arrTypeDatas: string[];
  /** 布尔类型的数据名列表（来自 data/computed/store） */
  boolTypeDatas: string[];
  /** 事件名列表（原始方法名，如 subInline_onTap） */
  events: string[];
};

/** CustomComponent 信息映射表，以变量名为 key。 */
export type CustomComponentInfoRecord = Record<ComponentName, CustomComponentInfo | undefined>;

/**
 * 已由 TypeScript 类型导入确认的外部子组件。
 *
 * key 是 `CustomComponent` 变量名，value 是其类型导入语句中的原始模块路径。
 * JSON 校验器会在知道组件和项目根目录后将该路径转换为 `usingComponents` 路径。
 */
export type ImportedSubComponentSourceRecord = Record<ComponentName, string>;

/** ------------------- ChunkComponentInfo----------------*/

/**
 * ChunkComponent 在 WXML 中提供局部数据作用域，而非自定义组件的属性契约。
 */
export type ChunkComponentInfo = {
  /** 声明所在行号 */
  line: number;
  /** 定义 ChunkComponent 的 TS 文件路径 */
  fsPath: string;
  /** 数组类型的数据名列表 */
  arrTypeDatas: string[];
  /** 布尔类型的数据名列表 */
  boolTypeDatas: string[];
  /** Chunk 内可访问的全部数据名 */
  dataList: string[];
  /** Chunk 内可绑定的事件名 */
  events: string[];
};

/** ChunkComponent 信息映射表，以变量名为 key。 */
export type ChunkComponentInfoRecord = Record<ComponentName, ChunkComponentInfo | undefined>;

/** ------------------- TsFileInfo----------------*/

/** TS 文件解析结果 */
export type TsFileInfo = {
  rootComponentInfo: RootComponentInfo;
  customComponentInfoRecord: CustomComponentInfoRecord;
  chunkComponentInfoRecord: ChunkComponentInfoRecord;
  importedSubComponentSourceRecord: ImportedSubComponentSourceRecord;
};
