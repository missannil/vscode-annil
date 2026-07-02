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
/** ------------------- SubComponentInfo----------------*/

// /**
//  * 属性值的类型定义
//  */

// export const CUSTOM = "自定义";

// /** 自定义类型值 */
// export type Custom = { type: "Custom"; value: typeof CUSTOM };

// /** 根数据路径引用 */
// export type Root = { type: "Root"; value: string };

// /** 联合类型值 */
// export type Union = { type: "Union"; values: string[] };

// /** 继承类型: 自定义 | 根数据 | 联合 */
// export type Inherit = Custom | Root | Union;

// /**
//  * 自定义组件的配置信息
//  * 描述子组件的属性定义
//  */
// export type SubComponentConfig = {
//   inherit: Inherit;
//   events: string[];
//   self: string[];
// };

// export type SubComponentInfo = {
//   line: number;
//   fsPath?: string;
//   componentTypeName: string;
//   // configInfo: SubComponentConfig;
// };

// type SubCompName = string;

// export type SubComponentInfoRecord = { [key in SubCompName]?: SubComponentInfo };

/** ------------------- ImportedSubCompRecord----------------*/
// type ImportName = string;

// type ImportPath = string;

// /** 导入的子组件路径映射 */
// type ImportedSubCompRecord = Record<ImportName, ImportPath>;

// ts文件信息
export type TsFileInfo = {
  rootComponentInfo: RootComponentInfo;
  //   subComponentInfoRecord: SubComponentInfoRecord;
  //   // 记录组件导入的子组件信息 为了验证组件json文件的合法性，例如 {"h_image":"./$Image","button":"@components/$button"}
  //   importedSubCompRecord: ImportedSubCompRecord;
};
