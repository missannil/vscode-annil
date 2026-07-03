/** ------------------- RootComponentInfo----------------*/

/**
 * 根组件（Page/Component）的配置信息
 * 描述组件自身的数据、事件、计算属性等
 */
export type RootComponentInfo = {
  /** 数组类型的数据名列表，用于判断 wxml 中 wx:for 循环变量的类型 */
  arrTypeDatas: string[];
  /** 布尔类型的数据名列表,用于判断 wxml 中 wx:if 条件变量的类型 */
  boolTypeDatas: string[];
  /** 所有数据名列表 用于判断 wxml 中数据绑定的值是否正确 */
  dataList: string[];
  /** 事件名列表 用于判断 wxml 中 bind:xxx 和 catch:xxx 中事件数据的类型 */
  events: string[];
};

/** ------------------- AttrValue（属性值类型）----------------*/

/** "自定义" 常量，表示属性值来自 WXML 自定义传值 */
export const CUSTOM = "自定义";

/** 自定义值类型 — 表示属性值由 WXML 模板传入，无法在 TS 中静态推断 */
export type Custom = { type: "Custom"; value: typeof CUSTOM };

/** 根数据路径引用 — 表示属性值来自 RootComponent 的数据路径 */
export type Root = { type: "Root"; value: string };

/** 联合类型值 — 表示属性值可以是多个联合成员之一 */
export type Union = { type: "Union"; values: string[] };

/** 继承类型 — 表示子组件属性可接受的值的来源：自定义传入 | 根数据路径 | 联合类型 */
export type Inherit = Custom | Root | Union;

/** 事件类型 — 表示属性值是一个事件绑定 */
export type Events = { type: "Events"; value: string };

/** 自身数据类型 — 表示属性值来自组件自身的数据字段（data/computed/store） */
export type Self = { type: "Self"; value: string };

/** 属性值联合类型 — 所有可能的属性值来源 */
export type AttrValue = Inherit | Events | Self;

/** ------------------- SubComponentInfo----------------*/

/** 子组件名（变量名） */
type SubCompName = string;

/**
 * 子组件配置信息（统一类型）
 *
 * annil 升级后，原有的 CustomComponent 和 ChunkComponent 统一为 SubComponent API。
 * 此类型兼顾了过去两种 API 的数据结构：
 * - configInfo: 属性值映射（继承自旧 CustomComponent），用于校验 WXML 属性绑定
 * - arrTypeDatas / boolTypeDatas / dataList / events: 数据类型列表（继承自旧 ChunkComponent），用于校验 WXML 数据引用
 */
export type SubComponentInfo = {
  /** 声明所在行号 */
  line: number;
  /** 文件路径（子组件可能定义在不同文件） */
  fsPath?: string;
  /** 组件类型名（泛型参数），如 $Image，仅 typed subcomponent 有此值 */
  componentTypeName?: string;
  /**
   * 属性配置映射
   * - inherit 字段 → AttrValue（Root/Union/Custom）
   * - data/computed/store 字段 → Self
   * - events 字段 → Events
   */
  configInfo: Record<string, AttrValue>;
  /** 数组类型的数据名列表 */
  arrTypeDatas: string[];
  /** 布尔类型的数据名列表 */
  boolTypeDatas: string[];
  /** 所有数据名列表 */
  dataList: string[];
  /** 事件名列表 */
  events: string[];
};

/** 子组件信息映射表，以变量名为 key */
export type SubComponentInfoRecord = Record<SubCompName, SubComponentInfo | undefined>;

/** ------------------- TsFileInfo----------------*/

/** TS 文件解析结果 */
export type TsFileInfo = {
  rootComponentInfo: RootComponentInfo;
  subComponentInfoRecord: SubComponentInfoRecord;
};
