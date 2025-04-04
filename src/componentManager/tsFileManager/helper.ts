/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Node } from "@babel/traverse";
import type { AttrValue, Custom, CustomComponentInfo, Events, Root, Self, Union } from "./types";

export function isArraySingleType(node: Node): boolean {
  // 例如 `{ xxx: Array}` 时(后面没有as 类型的情况 )
  return node.type === "Identifier" && node.name === "Array";
}

export function isBoolSingleType(node: Node): boolean {
  // 例如 `{ xxx: Bool}` 时(后面没有as 类型的情况 )
  return node.type === "Identifier" && node.name === "Boolean";
}

export function isTsArraySingleType(node: Node): boolean {
  // 例如 `{ xxx: Array as DetailedType<UserList> }` 时
  return node.type === "TSAsExpression" && isArraySingleType(node.expression);
}

// 如果第二个参数为undefined或有值,则是chunk组件
export function isChunkComponent(expression: any): boolean {
  const secondParam = expression.callee?.typeParameters?.params[1];
  if (secondParam === undefined || secondParam.literal?.type === "StringLiteral") return true;

  return false;
}

// export function isCustomComponent(secondParam: any): boolean {
// const secondParam = expression.callee?.typeParameters?.params[1];
// if (secondParam !== undefined && secondParam.literal?.type !== "StringLiteral") return true;

// return false;
// }

/**
   * 判断是否是对象配置的数组类型
   * 例如:
   * ```ts
   *  {
		type: Array // or  as DetailedType<ProductList>,
		value: [{ name: "apple", price: 10 }, { name: "banana", price: 30}],
	  },
	  ```
   */
export function isFullConfigOfArrayType(node: Node): boolean {
  if (node.type === "ObjectExpression") {
    const typeFieldConfig = (node.properties[0] as any).value as Node;

    return isArraySingleType(typeFieldConfig) || isTsArraySingleType(typeFieldConfig);
  }

  return false;
}

export function isFullConfigOfBoolType(node: Node): boolean {
  if (node.type === "ObjectExpression") {
    const typeFieldConfig = (node.properties[0] as any).value as Node;

    return isBoolSingleType(typeFieldConfig);
  }

  return false;
}

export function isArrayTypeOfPropertiesFields(node: Node): boolean {
  return isArraySingleType(node) || isTsArraySingleType(node) || isFullConfigOfArrayType(node);
}

export function isBoolTypeOfPropertiesFields(node: Node): boolean {
  return isBoolSingleType(node) || isFullConfigOfBoolType(node);
}

export function isArrayTypeFunction(node: Node): boolean {
  if (
    (node.type === "ObjectMethod" || node.type === "ArrowFunctionExpression") && node.returnType
    && node.returnType.type === "TSTypeAnnotation"
    && node.returnType.typeAnnotation.type === "TSArrayType"
  ) {
    return true;
  }

  return false;
}

export function isBoolTypeFunction(node: Node): boolean {
  if (
    (node.type === "ObjectMethod" || node.type === "ArrowFunctionExpression") && node.returnType
    && node.returnType.type === "TSTypeAnnotation"
    && node.returnType.typeAnnotation.type === "TSBooleanKeyword"
  ) {
    return true;
  }

  return false;
}

export function isNormalAttrType(node: Node): boolean {
  return node.type === "ArrayExpression"
    || node.type === "TSAsExpression" && node.typeAnnotation.type === "TSArrayType";
}

export function isBoolAttrType(node: Node): boolean {
  return node.type === "BooleanLiteral"
    || node.type === "TSAsExpression" && node.typeAnnotation.type === "TSBooleanKeyword";
}

export function isEventsValue(attrValue: AttrValue): attrValue is Events {
  return attrValue.type === "Events";
}

export function isCustomValue(attrValue: AttrValue): attrValue is Custom {
  return attrValue.type === "Custom";
}

export function isUnionValue(attrValue: AttrValue): attrValue is Union {
  return attrValue.type === "Union";
}

// 获取自定义组件的所有变量
export function getVariablesFromComponentInfo(componentInfo: CustomComponentInfo): string[] {
  return Object.values(componentInfo).reduce<string[]>((acc, cur) => {
    acc.push(...(isUnionValue(cur) ? cur.values : isCustomValue(cur) || isEventsValue(cur) ? [] : [cur.value]));

    return acc;
  }, []);
}

export function isRootValue(attrValue: AttrValue): attrValue is Root {
  return attrValue.type === "Root";
}

export function isSelfValue(attrValue: AttrValue): attrValue is Self {
  return attrValue.type === "Self";
}
// type ArrayExpression = { type: "ArrayExpression"; elements: StringLiteral[] };
// type StringLiteral = { type: "StringLiteral"; value: string };

// function isArrayExpression(node: Node): node is ArrayExpression {
//   return node.type === "ArrayExpression";
// }

// function isStringLiteral(node: Node): node is StringLiteral {
//   return node.type === "StringLiteral";
// }
