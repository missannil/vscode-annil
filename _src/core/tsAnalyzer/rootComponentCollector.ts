import {
  type CallExpression,
  isArrayExpression,
  isArrowFunctionExpression,
  isBooleanLiteral,
  isIdentifier,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isStringLiteral,
  isTSArrayType,
  isTSBooleanKeyword,
  type ObjectExpression,
  type ObjectMethod,
  type ObjectProperty,
} from "@babel/types";
import type { RootComponentInfo } from "../types/index.js";

/**
 * 从 RootComponent()({ ... }) 第二次调用的配置对象中提取 properties、data、computed、store、events 等信息
 *
 * @param expression - RootComponent()({...}) 最外层的 CallExpression 节点，其 arguments[0] 为配置对象
 * @param result - 结果对象，会被原地修改
 * @param innerPrefix - 内部字段前缀，匹配该前缀的字段不会被收集（默认 "_"）
 */
// eslint-disable-next-line complexity
export function collectRootComponentInfo(
  expression: CallExpression,
  result: RootComponentInfo,
  innerPrefix: string,
): void {
  // 1. 取出第二次调用的参数 → 即配置对象 { properties: {...}, data: {...}, ... }
  const config = expression.arguments[0];

  // 2. 配置必须为对象字面量，排除变量引用等非字面量写法
  if (!isObjectExpression(config)) return;

  // 3. 需要收集的顶层字段名白名单
  const extractedFields = ["properties", "data", "computed", "store", "events"];

  // 4. 遍历配置对象的每一个顶层字段
  for (const field of config.properties) {
    // 4a. 顶层字段必须是 ObjectProperty（排除 SpreadElement、ObjectMethod 等）
    if (!isObjectProperty(field)) continue;

    // 4b. 获取字段名，不在白名单中则跳过（如 methods、lifetimes 等非关注字段）
    const name = getKeyName(field);
    if (name === undefined || !extractedFields.includes(name)) continue;

    // 4c. 字段值必须是对象字面量（如 properties: { ... }），排除变量引用
    if (!isObjectExpression(field.value)) continue;

    // 5. 遍历子对象中的每一个属性/方法
    for (const subField of field.value.properties) {
      // 5a. 处理 ObjectProperty → data、store、properties 中的键值对形式，跳过内部字段
      if (isObjectProperty(subField)) {
        const subName = getKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        collectFieldData(name, subName, subField.value, result);
      } // 5b. 处理 ObjectMethod → computed、events 中的简写方法形式，如 computedList() { ... }
      else if (isObjectMethod(subField)) {
        const subName = getObjectMethodKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        collectMethodData(name, subName, subField, result);
      }
    }
  }
}

// ---- 字段数据收集 ----

/**
 * 收集 ObjectProperty 形式的字段数据（data、store、properties 中的键值对）
 *
 * @param fieldName - 顶层字段名（properties/data/computed/store/events）
 * @param subName - 子字段名
 * @param value - 子字段的值节点
 * @param result - 结果对象，原地修改
 */
// eslint-disable-next-line complexity
function collectFieldData(
  fieldName: string,
  subName: string,
  value: ObjectProperty["value"],
  result: RootComponentInfo,
): void {
  switch (fieldName) {
    case "events":
      // 事件名直接加入 events 列表
      result.events.push(subName);
      break;
    case "properties": {
      // 1. 属性名统一加入 dataList
      result.dataList.push(subName);
      // 2. 判断属性类型 → 决定是否加入 arrTypeDatas / boolTypeDatas
      if (isObjectExpression(value)) {
        // 2a. 对象形式 { type: Array, value: [] } → 解包 type 属性判断类型
        const typeValue = findPropValueInObject(value, "type");
        if (typeValue && isArrayType(typeValue)) result.arrTypeDatas.push(subName);
        if (typeValue && isBoolType(typeValue)) result.boolTypeDatas.push(subName);
      } else {
        // 2b. 简写形式 propName: Array / propName: Boolean → 直接判断
        if (isArrayType(value)) result.arrTypeDatas.push(subName);
        if (isBoolType(value)) result.boolTypeDatas.push(subName);
      }
      break;
    }
    case "computed":
    case "store":
      // computed/store 中的箭头函数形式，加入 dataList 并检查返回类型
      result.dataList.push(subName);
      if (isArrayTypeFunction(value)) result.arrTypeDatas.push(subName);
      if (isBoolTypeFunction(value)) result.boolTypeDatas.push(subName);
      break;
    case "data":
      // data 中的字面量形式
      result.dataList.push(subName);
      if (isArrayType(value)) result.arrTypeDatas.push(subName);
      if (isBoolType(value)) result.boolTypeDatas.push(subName);
      break;
  }
}

// ---- 类型守卫 ----

/** 获取 ObjectProperty 的键名 */
function getKeyName(prop: ObjectProperty): string | undefined {
  if (isIdentifier(prop.key)) return prop.key.name;
  if (isStringLiteral(prop.key)) return prop.key.value;

  return undefined;
}

/** 获取 ObjectMethod 的键名 */
function getObjectMethodKeyName(method: ObjectMethod): string | undefined {
  if (isIdentifier(method.key)) return method.key.name;
  if (isStringLiteral(method.key)) return method.key.value;

  return undefined;
}

/** 在 ObjectExpression 中按 key 名查找属性值 */
function findPropValueInObject(
  obj: ObjectExpression,
  keyName: string,
): ObjectProperty["value"] | undefined {
  for (const prop of obj.properties) {
    if (isObjectProperty(prop)) {
      const name = getKeyName(prop);
      if (name === keyName) return prop.value;
    }
  }

  return undefined;
}

/**
 * 收集 ObjectMethod 形式的字段数据（computed、events 中的简写方法）
 *
 * @param fieldName - 顶层字段名（computed/events）
 * @param subName - 方法名
 * @param method - 方法的 AST 节点
 * @param result - 结果对象，原地修改
 */
function collectMethodData(
  fieldName: string,
  subName: string,
  method: ObjectMethod,
  result: RootComponentInfo,
): void {
  switch (fieldName) {
    case "events":
      // 事件方法名直接加入 events 列表
      result.events.push(subName);
      break;
    case "computed": {
      // 1. 计算属性名加入 dataList
      result.dataList.push(subName);
      // 2. 通过方法的返回类型注解推断数组/布尔类型
      const returnType = method.returnType?.typeAnnotation;
      if (returnType && isTSArrayType(returnType)) result.arrTypeDatas.push(subName);
      if (returnType && isTSBooleanKeyword(returnType)) result.boolTypeDatas.push(subName);
      break;
    }
  }
}

/** 判断 properties / data 字段值的属性类型 */
function isArrayType(value: ObjectProperty["value"]): boolean {
  return isArrayExpression(value)
    || isTSArrayType(value)
    || (isIdentifier(value) && value.name === "Array");
}

function isBoolType(value: ObjectProperty["value"]): boolean {
  return isBooleanLiteral(value)
    || isTSBooleanKeyword(value)
    || (isIdentifier(value) && value.name === "Boolean");
}

/** computed / store 字段值的属性类型 */
function isArrayTypeFunction(value: ObjectProperty["value"]): boolean {
  return isArrowFunctionExpression(value) && isArrayExpression(value.body);
}

function isBoolTypeFunction(value: ObjectProperty["value"]): boolean {
  return isArrowFunctionExpression(value) && isBooleanLiteral(value.body);
}
