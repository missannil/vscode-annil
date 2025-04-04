/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertNonNullable } from "../../utils/assertNonNullable";

import { getInheritValue } from "./getInheritValue";
import type { CustomComponentInfo, Events } from "./types";
const customComponentExtractedFields = ["inherit", "data", "computed", "store", "events"];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,
export function generateCustomCompInfo(expression: any): CustomComponentInfo {
  const customCompAttrs: CustomComponentInfo = {};
  // 因为就一个参数,所以直接取第一个 arguments[0]即可,properties为配置对象的第一层配置字段 inherit data store computed watch methods evnets lifetimes等
  expression.arguments[0].properties.forEach(
    // firstLevelField 为 inherit data store computed evnets methods watch等字段
    (firstLevelField: any) => {
      // 如果不是有效字段,则不需要加入到属性中。
      if (!customComponentExtractedFields.includes(firstLevelField.key.name)) return;
      // 第一层级字段的值即进入第二层级的配置,再次遍历 即得到有效字段的配置(值)
      firstLevelField.value.properties.forEach(
        (secondLevelField: any) => {
          // secondLevelFieldName为第二层级的配置字段名
          const secondLevelFieldName = secondLevelField.key.name as string;
          // 如果是以_开头的字段,则不需要处理,这些是定义的内部字段。
          if (secondLevelFieldName.startsWith("_")) {
            return;
          }
          // 不是以_开头的字段,则需要处理,因为这是要传递给组件的属性
          const regex = /[^_]*_(.*)/; // 以第一个_开头的字符串，这是要传递的真实属性
          // 去除前缀后的字段是传递给组件的真实属性
          const realAttr = assertNonNullable(secondLevelFieldName.match(regex))[1];
          switch (firstLevelField.key.name) {
            // inherit传递规则与其他字段不同,所以单独处理
            case "inherit":
              // inherit字段的属性值有可能是数组或字符串或wxFor中的值(value中带有:的值)
              customCompAttrs[realAttr] = getInheritValue(secondLevelField.value);
              break;
            case "events":
              // 事件字段名根据后缀来处理,不是catch后缀用bind:否则用catch:
              {
                if (secondLevelFieldName.endsWith("_catch")) {
                  customCompAttrs[
                    // 去除realAttr 后六位 (即"_catch")的字段名
                    `catch:${realAttr.slice(0, -6)}`
                  ] = { type: "Events", value: `${secondLevelFieldName}` } satisfies Events;
                } else {
                  customCompAttrs[
                    `bind:${realAttr}`
                  ] = { type: "Events", value: `${secondLevelFieldName}` } satisfies Events;
                }
              }
              break;
            default:
              // 其他字段的传递的属性值就是字段名 dataFields
              customCompAttrs[realAttr] = { type: "Self", value: secondLevelFieldName };
          }
        },
      );
    },
  );

  return customCompAttrs;
}
