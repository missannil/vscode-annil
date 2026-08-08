import type { CallExpression } from "@babel/types";
import type { RootComponentInfo } from "../types/index.js";
import { addToDataList, addToEvents, walkComponentConfig } from "./walkComponentConfig.js";

/**
 * 从 RootComponent()({ ... }) 第二次调用的配置对象中提取
 * properties、data、computed、store、events 等信息
 *
 * @param expression - RootComponent()({...}) 最外层 CallExpression 节点
 * @param result - 结果对象，会被原地修改
 * @param innerPrefix - 内部字段前缀（默认 "_"）
 */
export function collectRootComponentInfo(
  expression: CallExpression,
  result: RootComponentInfo,
  innerPrefix: string,
): void {
  walkComponentConfig(
    expression,
    ["properties", "data", "computed", "store", "events", "customEvents"],
    innerPrefix,
    // onProperty
    (fieldName, subName, value) => {
      switch (fieldName) {
        case "events":
        case "customEvents":
          addToEvents(subName, result.events);
          break;
        case "properties":
        case "data":
        case "computed":
        case "store":
          addToDataList(subName, value, result.arrTypeDatas, result.boolTypeDatas, result.dataList);
          break;
      }
    },
    // onMethod
    (fieldName, subName, method) => {
      switch (fieldName) {
        case "events":
        case "customEvents":
          addToEvents(subName, result.events);
          break;
        case "computed":
          addToDataList(subName, method, result.arrTypeDatas, result.boolTypeDatas, result.dataList);
          break;
      }
    },
  );
}
