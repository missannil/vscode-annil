/** usingComponents 字段：组件标签名 → 组件路径 */
export type UsingComponents = Record<string, string>;

/** componentPlaceholder 字段：组件标签名 → 占位组件名 */
export type ComponentPlaceholder = Record<string, string>;

/** JSON 配置文件顶层结构 */
export type JsonConfig = {
  component?: true;
  usingComponents?: UsingComponents;
  componentPlaceholder?: ComponentPlaceholder;
};

/** JSON 文件解析结果 */
export type JsonFileInfo = {
  /** 解析后的配置对象 */
  config: JsonConfig;
  /** 原始文本 */
  text: string;
};
