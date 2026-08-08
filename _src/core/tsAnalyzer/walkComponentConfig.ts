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

// ---- 公共遍历入口 ----

/**
 * 遍历组件配置对象，分发到 onProperty / onMethod 回调
 *
 * 供 RootComponent 和 SubComponent 的 collector 复用。
 * 两者的差异（properties vs inherit、事件前缀剥离等）通过 extractedFields 和回调下沉。
 *
 * @param expression - XxxComponent()({...}) 最外层 CallExpression 节点
 * @param extractedFields - 需要收集的顶层字段名白名单
 * @param innerPrefix - 内部字段前缀，匹配该前缀的字段不会被收集
 * @param onProperty - 处理 ObjectProperty 形式的字段
 * @param onMethod - 处理 ObjectMethod 形式的字段
 */
// eslint-disable-next-line complexity
export function walkComponentConfig(
  expression: CallExpression,
  extractedFields: string[],
  innerPrefix: string,
  onProperty: (fieldName: string, subName: string, value: ObjectProperty["value"]) => void,
  onMethod: (fieldName: string, subName: string, method: ObjectMethod) => void,
): void {
  // 1. 取出第二次调用的参数 → 配置对象 { ... }
  const config = expression.arguments[0];

  // 2. 配置必须为对象字面量
  if (!isObjectExpression(config)) return;

  // 3. 遍历顶层字段
  for (const field of config.properties) {
    if (!isObjectProperty(field)) continue;

    const fieldName = getKeyName(field);
    if (fieldName === undefined || !extractedFields.includes(fieldName)) continue;

    if (!isObjectExpression(field.value)) continue;

    // 4. 遍历子属性/方法，跳过内部字段
    for (const subField of field.value.properties) {
      if (isObjectProperty(subField)) {
        const subName = getKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        onProperty(fieldName, subName, subField.value);
      } else if (isObjectMethod(subField)) {
        const subName = getObjectMethodKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        onMethod(fieldName, subName, subField);
      }
    }
  }
}

// ---- 公共类型守卫 ----

/** 获取 ObjectProperty 的键名 */
export function getKeyName(prop: ObjectProperty): string | undefined {
  if (isIdentifier(prop.key)) return prop.key.name;
  if (isStringLiteral(prop.key)) return prop.key.value;

  return undefined;
}

/** 获取 ObjectMethod 的键名 */
export function getObjectMethodKeyName(method: ObjectMethod): string | undefined {
  if (isIdentifier(method.key)) return method.key.name;
  if (isStringLiteral(method.key)) return method.key.value;

  return undefined;
}

/** 在 ObjectExpression 中按 key 名查找属性值 */
export function findPropValueInObject(
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

/** 判断 properties / data 字段值的数组类型 */
export function isArrayType(value: ObjectProperty["value"]): boolean {
  return isArrayExpression(value)
    || isTSArrayType(value)
    || (isIdentifier(value) && value.name === "Array");
}

/** 判断 properties / data 字段值的布尔类型 */
export function isBoolType(value: ObjectProperty["value"]): boolean {
  return isBooleanLiteral(value)
    || isTSBooleanKeyword(value)
    || (isIdentifier(value) && value.name === "Boolean");
}

/** computed / store 字段值的数组返回类型 */
export function isArrayTypeFunction(value: ObjectProperty["value"]): boolean {
  return isArrowFunctionExpression(value) && isArrayExpression(value.body);
}

/** computed / store 字段值的布尔返回类型 */
export function isBoolTypeFunction(value: ObjectProperty["value"]): boolean {
  if (!isArrowFunctionExpression(value)) return false;

  return value.returnType != null && isTSBooleanKeyword(value.returnType.typeAnnotation);
}

// ---- 公共收集原子操作 ----

/**
 * 收集 data/computed/store/properties 字段 → dataList + 类型检测
 *
 * 对 Root 的 properties 和 Sub 的 inherit（非 "wxml"），都要入 dataList 并做数组/布尔检测。
 */
// eslint-disable-next-line complexity
export function addToDataList(
  name: string,
  value: ObjectProperty["value"] | ObjectMethod,
  arrTypeDatas: string[],
  boolTypeDatas: string[],
  dataList?: string[],
): void {
  dataList?.push(name);
  // ObjectProperty：通过值表达式判断类型
  if (!isObjectMethod(value)) {
    if (isObjectExpression(value)) {
      const typeValue = findPropValueInObject(value, "type");
      if (typeValue && isArrayType(typeValue)) arrTypeDatas.push(name);
      if (typeValue && isBoolType(typeValue)) boolTypeDatas.push(name);
    } else {
      if (isArrayType(value)) arrTypeDatas.push(name);
      if (isBoolType(value)) boolTypeDatas.push(name);
    }
    if (isArrayTypeFunction(value)) arrTypeDatas.push(name);
    if (isBoolTypeFunction(value)) boolTypeDatas.push(name);
  } else {
    // ObjectMethod：通过返回类型注解判断
    const returnType = value.returnType?.typeAnnotation;
    if (returnType && isTSArrayType(returnType)) arrTypeDatas.push(name);
    if (returnType && isTSBooleanKeyword(returnType)) boolTypeDatas.push(name);
  }
}

/**
 * 将不变事件名加入 events 列表
 *
 * @param rawName - 原始事件名（子组件中为带前缀的完整名，如 subInline_onTap）
 */
export function addToEvents(name: string, events: string[]): void {
  events.push(name);
}
