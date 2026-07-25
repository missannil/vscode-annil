import type { CallExpression } from "@babel/types";
import type { ChunkComponentInfo, ChunkComponentInfoRecord } from "../types/index.js";
import { addToDataList, addToEvents, walkComponentConfig } from "./walkComponentConfig.js";

/** 收集 ChunkComponent 在 WXML 中提供的局部数据和事件作用域。 */
export function collectChunkComponentInfo(
  variableName: string,
  expression: CallExpression,
  chunkComponentInfoRecord: ChunkComponentInfoRecord,
  fsPath: string,
  innerPrefix: string,
): void {
  const info: ChunkComponentInfo = {
    line: expression.loc?.start.line ?? 0,
    fsPath,
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: [],
    events: [],
  };

  walkComponentConfig(
    expression,
    ["properties", "data", "computed", "store", "events"],
    innerPrefix,
    (fieldName, subName, value) => {
      if (fieldName === "events") {
        addToEvents(subName, info.events);

        return;
      }
      addToDataList(subName, value, info.arrTypeDatas, info.boolTypeDatas, info.dataList);
    },
    (fieldName, subName, method) => {
      if (fieldName === "events") {
        addToEvents(subName, info.events);

        return;
      }
      if (fieldName === "computed") {
        addToDataList(subName, method, info.arrTypeDatas, info.boolTypeDatas, info.dataList);
      }
    },
  );

  chunkComponentInfoRecord[variableName] = info;
}
