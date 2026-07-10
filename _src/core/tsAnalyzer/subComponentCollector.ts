import {
  type ArrayExpression,
  type CallExpression,
  type Identifier,
  isArrayExpression,
  isStringLiteral,
  type StringLiteral,
} from "@babel/types";
import {
  CUSTOM,
  type Custom,
  type Events,
  type Root,
  type SubComponentInfo,
  type SubComponentInfoRecord,
  type Ternary,
} from "../types/index.js";
import { addToDataList, walkComponentConfig } from "./walkComponentConfig.js";

/**
 * 去掉子组件字段名前缀（第一个 _ 及其之前的部分）
 *
 * 例如：subInline_onTap → onTap、subInline_eventA_catch → eventA_catch
 */
function stripPrefix(name: string): string {
  const regex = /[^_]*_(.*)/;
  const match = name.match(regex);

  return match?.[1] ?? name;
}

// ---- inherit 字段专用：解析属性值为 AttrValue ----

/**
 * 将 inherit 字段的属性值节点解析为 AttrValue
 *
 * 支持的节点类型：
 * - StringLiteral("wxml") → Custom（自定义传值，无法静态推断）
 * - StringLiteral 其他 → Root（父组件数据路径引用）
 * - ArrayExpression(["a", "b"]) → Ternary（三元表达式）
 */
function getInheritValue(
  valueElement: StringLiteral | Identifier | ArrayExpression,
): Custom | Root | Ternary {
  if (isStringLiteral(valueElement)) {
    if (valueElement.value === "wxml") {
      return { type: "Custom", value: CUSTOM } satisfies Custom;
    }

    return { type: "Root", value: valueElement.value } satisfies Root;
  }
  if (isArrayExpression(valueElement)) {
    return {
      type: "Ternary",
      values: valueElement.elements.map((element) => (element as StringLiteral).value),
    } satisfies Ternary;
  }
  throw Error(`getInheritValue: 意外的节点类型 ${valueElement.type}`);
}

/**
 * 从 SubComponent()({ ... }) 调用表达式中收集子组件配置信息
 *
 * configInfo 是核心：属性名 → AttrValue 的映射，供 WXML 逐属性精确校验。
 *
 * @param variableName - 变量声明名
 * @param componentTypeName - 组件类型名（泛型参数），可能为 undefined
 * @param expression - SubComponent()({...}) 最外层 CallExpression 节点
 * @param subComponentInfoRecord - 结果映射表，原地修改
 * @param fsPath - TS 文件路径
 * @param innerPrefix - 内部字段前缀（默认 "_"）
 */
export function collectSubComponentInfo(
  variableName: string,
  componentTypeName: string | undefined,
  expression: CallExpression,
  subComponentInfoRecord: SubComponentInfoRecord,
  fsPath: string,
  innerPrefix: string,
): void {
  // 1. 初始化子组件信息
  const info: SubComponentInfo = {
    line: expression.loc?.start.line ?? 0,
    fsPath,
    configInfo: {},
    arrTypeDatas: [],
    boolTypeDatas: [],
    events: [],
  };
  if (componentTypeName !== undefined) {
    info.componentTypeName = componentTypeName;
  }

  // 2. 复用 walkComponentConfig 遍历配置对象
  walkComponentConfig(
    expression,
    ["inherit", "data", "computed", "store", "events"],
    innerPrefix,
    // onProperty
    (fieldName, subName, value) => {
      switch (fieldName) {
        case "inherit":
          // inherit 字段 → 生成 Root / Custom / Ternary
          try {
            info.configInfo[subName] = getInheritValue(value as StringLiteral | Identifier | ArrayExpression);
          } catch {
            // 无法识别的 inherit 值，跳过
          }
          break;
        case "events":
          // 事件字段 → addEventToConfigInfo 内部已处理 events 收集
          addEventToConfigInfo(info, subName);
          break;
        case "data":
        case "computed":
        case "store":
          // data/computed/store → { type: "Self", value: subName }
          info.configInfo[subName] = { type: "Self", value: subName };
          addToDataList(subName, value, info.arrTypeDatas, info.boolTypeDatas);
          break;
      }
    },
    // onMethod
    (fieldName, subName, method) => {
      switch (fieldName) {
        case "events":
          // 事件方法 → addEventToConfigInfo 内部已处理 events 收集
          addEventToConfigInfo(info, subName);
          break;
        case "computed":
          info.configInfo[subName] = { type: "Self", value: subName };
          addToDataList(subName, method, info.arrTypeDatas, info.boolTypeDatas);
          break;
      }
    },
  );

  // 3. 写入结果映射表
  subComponentInfoRecord[variableName] = info;
}

/**
 * 将事件名写入 configInfo，采用旧 CustomComponent 约定：
 * - xxx → configInfo key 为 bind:xxx
 * - xxx_catch → configInfo key 为 catch:xxx（去掉 _catch 后缀）
 * 同时将原始方法名加入 events 列表
 */
function addEventToConfigInfo(info: SubComponentInfo, rawName: string): void {
  const realAttr = stripPrefix(rawName);
  if (realAttr.endsWith("_catch")) {
    const eventName = realAttr.slice(0, -6); // 去掉 "_catch"
    info.configInfo[`catch:${eventName}`] = { type: "Events", value: rawName } satisfies Events;
  } else {
    info.configInfo[`bind:${realAttr}`] = { type: "Events", value: rawName } satisfies Events;
  }
  info.events.push(rawName);
}
