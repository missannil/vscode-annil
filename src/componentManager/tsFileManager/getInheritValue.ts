import {
  type ArrayExpression,
  type Identifier,
  isArrayExpression,
  isStringLiteral,
  type StringLiteral,
} from "@babel/types";
import { CUSTOM, type Custom, type Root, type Union } from "./types";

export function getInheritValue(valueElement: StringLiteral | Identifier | ArrayExpression): Custom | Root | Union {
  if (isStringLiteral(valueElement)) {
    if (valueElement.value === "wxml") {
      // 如果是wxml字符串或者是WXML变量,则表示自定义值
      return { type: "Custom", value: CUSTOM } satisfies Custom;
    }

    return { type: "Root", value: valueElement.value } satisfies Root;
  }
  if (isArrayExpression(valueElement)) {
    return {
      type: "Union",
      values: valueElement.elements.map((element) => (element as StringLiteral).value),
    } satisfies Union;
  }
  throw Error("不应出现的错误:getInheritValue");
}
