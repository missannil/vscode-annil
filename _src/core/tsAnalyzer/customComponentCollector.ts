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
  type CustomComponentInfo,
  type CustomComponentInfoRecord,
  type Events,
  type Root,
  type Ternary,
} from "../types/index.js";
import { addToDataList, walkComponentConfig } from "./walkComponentConfig.js";

function stripPrefix(name: string): string {
  const match = name.match(/[^_]*_(.*)/);

  return match?.[1] ?? name;
}

function getInheritValue(valueElement: StringLiteral | Identifier | ArrayExpression): Custom | Root | Ternary {
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

/** 收集 CustomComponent 的逐属性传值契约。 */
export function collectCustomComponentInfo(
  variableName: string,
  componentTypeName: string | undefined,
  expression: CallExpression,
  customComponentInfoRecord: CustomComponentInfoRecord,
  fsPath: string,
  innerPrefix: string,
): void {
  const info: CustomComponentInfo = {
    line: expression.loc?.start.line ?? 0,
    fsPath,
    configInfo: {},
    arrTypeDatas: [],
    boolTypeDatas: [],
    events: [],
  };
  if (componentTypeName !== undefined) info.componentTypeName = componentTypeName;

  walkComponentConfig(
    expression,
    ["inherit", "data", "computed", "store", "events"],
    innerPrefix,
    (fieldName, subName, value) => {
      switch (fieldName) {
        case "inherit":
          try {
            info.configInfo[subName] = getInheritValue(value as StringLiteral | Identifier | ArrayExpression);
          } catch {
            // 无法静态识别的 inherit 写法不生成错误属性契约。
          }
          break;
        case "events":
          addEventToConfigInfo(info, subName);
          break;
        case "data":
        case "computed":
        case "store":
          info.configInfo[subName] = { type: "Self", value: subName };
          addToDataList(subName, value, info.arrTypeDatas, info.boolTypeDatas);
          break;
      }
    },
    (fieldName, subName, method) => {
      switch (fieldName) {
        case "events":
          addEventToConfigInfo(info, subName);
          break;
        case "computed":
          info.configInfo[subName] = { type: "Self", value: subName };
          addToDataList(subName, method, info.arrTypeDatas, info.boolTypeDatas);
          break;
      }
    },
  );

  customComponentInfoRecord[variableName] = info;
}

function addEventToConfigInfo(info: CustomComponentInfo, rawName: string): void {
  const realAttr = stripPrefix(rawName);
  if (realAttr.endsWith("_catch")) {
    info.configInfo[`catch:${realAttr.slice(0, -6)}`] = { type: "Events", value: rawName } satisfies Events;
  } else {
    info.configInfo[`bind:${realAttr}`] = { type: "Events", value: rawName } satisfies Events;
  }
  info.events.push(rawName);
}
