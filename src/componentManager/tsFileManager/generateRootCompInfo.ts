/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type { ArrowFunctionExpression, ObjectMethod } from "@babel/types";
import { configuration } from "../../configuration/index.js";
import {
  isArrayTypeFunction,
  isArrayTypeOfPropertiesFields,
  isBoolAttrType,
  isBoolTypeFunction,
  isBoolTypeOfPropertiesFields,
  isNormalAttrType,
} from "./helper";
import type { RootComponentInfo } from "./types";
const rootComponentExtractedFields = ["properties", "data", "computed", "store", "events", "customEvents"];

export function generateRootComponentInfo(expression: any): RootComponentInfo {
  const innerPrefix = configuration.innerDataPrefix;
  const rootComponentInfo: RootComponentInfo = {
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: [],
    events: [],
    customEvents: [],
  };
  expression.arguments[0].properties.forEach(
    (firstLevelField: any) => {
      const firstLevelAttrName = firstLevelField.key.name;
      if (!rootComponentExtractedFields.includes(firstLevelAttrName)) return;
      // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到有效字段的配置(值)
      firstLevelField.value.properties.forEach(
        (secondLevelField: any) => {
          // secondLevelFieldName有可能为 properties data computed store events了
          const secondLevelFieldName: string = secondLevelField.key.name;
          // 内部字段跳过
          if (secondLevelFieldName.startsWith(innerPrefix)) {
            return;
          }
          switch (firstLevelAttrName) {
            case "customEvents":
              rootComponentInfo.customEvents.push(secondLevelFieldName);
              break;
            case "events":
              rootComponentInfo.events.push(secondLevelFieldName);
              break;
            case "properties":
              {
                if (isArrayTypeOfPropertiesFields(secondLevelField.value)) {
                  rootComponentInfo.arrTypeDatas.push(secondLevelFieldName);
                }
                if (isBoolTypeOfPropertiesFields(secondLevelField.value)) {
                  rootComponentInfo.boolTypeDatas.push(secondLevelFieldName);
                }
                rootComponentInfo.dataList.push(secondLevelFieldName);
              }
              break;
            case "computed":
              if (isArrayTypeFunction(secondLevelField as ObjectMethod)) {
                rootComponentInfo.arrTypeDatas.push(secondLevelFieldName);
              }
              if (isBoolTypeFunction(secondLevelField as ObjectMethod)) {
                rootComponentInfo.boolTypeDatas.push(secondLevelFieldName);
              }
              rootComponentInfo.dataList.push(secondLevelFieldName);
              break;
            case "store":
              {
                if (isArrayTypeFunction(secondLevelField.value as ArrowFunctionExpression)) {
                  rootComponentInfo.arrTypeDatas.push(secondLevelFieldName);
                }
                if (isBoolTypeFunction(secondLevelField.value as ArrowFunctionExpression)) {
                  rootComponentInfo.boolTypeDatas.push(secondLevelFieldName);
                }
                rootComponentInfo.dataList.push(secondLevelFieldName);
              }
              break;
            case "data":
              {
                if (isNormalAttrType(secondLevelField.value)) {
                  rootComponentInfo.arrTypeDatas.push(secondLevelFieldName);
                }
                if (isBoolAttrType(secondLevelField.value)) {
                  rootComponentInfo.boolTypeDatas.push(secondLevelFieldName);
                }
                rootComponentInfo.dataList.push(secondLevelFieldName);
              }
              break;
            default:
              // console.log("没有处理的字段", firstLevelAttrName, secondLevelFieldName);
          }
        },
      );
    },
  );

  return rootComponentInfo;
}
