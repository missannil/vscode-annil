import {
  type ArrayExpression,
  type CallExpression,
  type Identifier,
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
  type Node,
  type ObjectMethod,
  type ObjectProperty,
  type StringLiteral,
} from "@babel/types";
import {
  CUSTOM,
  type Custom,
  type Events,
  type Root,
  type SubComponentInfo,
  type SubComponentInfoRecord,
  type Union,
} from "../types/index.js";

/**
 * 从 SubComponent()({ ... }) 调用表达式中收集子组件配置信息
 *
 * SubComponent 统一了旧的 CustomComponent 和 ChunkComponent 两个 API：
 * - configInfo: 属性值映射（来自 inherit/data/computed/store/events → 继承自 CustomComponent）
 * - arrTypeDatas / boolTypeDatas / dataList / events: 数据类型列表（继承自 ChunkComponent）
 *
 * @param variableName - 变量声明名（如 `const myComp = SubComponent({...})` 中的 `myComp`）
 * @param componentTypeName - 组件类型名（泛型参数，如 `SubComponent<$Image>()({...})` 中的 `$Image`），可能为 undefined
 * @param expression - SubComponent()({...}) 最外层 CallExpression 节点
 * @param subComponentInfoRecord - 结果映射表，原地修改
 * @param fsPath - TS 文件路径
 * @param innerPrefix - 内部字段前缀，匹配该前缀的字段不会被收集（默认 "_"）
 */
// eslint-disable-next-line complexity
export function collectSubComponentInfo(
  variableName: string,
  componentTypeName: string | undefined,
  expression: CallExpression,
  subComponentInfoRecord: SubComponentInfoRecord,
  fsPath: string,
  innerPrefix: string,
): void {
  // 1. 取出第二次调用的参数 → 配置对象 { inherit: {...}, data: {...}, ... }
  const config = expression.arguments[0];

  // 2. 配置必须为对象字面量
  if (!isObjectExpression(config)) return;

  // 3. 初始化子组件信息（exactOptionalPropertyTypes 下，可选属性不能显式赋 undefined）
  const info: SubComponentInfo = {
    line: expression.loc?.start.line ?? 0,
    fsPath,
    configInfo: {},
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: [],
    events: [],
  };
  if (componentTypeName !== undefined) {
    info.componentTypeName = componentTypeName;
  }

  // 4. 需要收集的顶层字段名白名单
  const extractedFields = ["inherit", "data", "computed", "store", "events"];

  // 5. 遍历配置对象的每一个顶层字段
  for (const field of config.properties) {
    if (!isObjectProperty(field)) continue;

    const fieldName = getKeyName(field);
    if (fieldName === undefined || !extractedFields.includes(fieldName)) continue;

    if (!isObjectExpression(field.value)) continue;

    // 6. 遍历子对象中的每一个属性/方法
    for (const subField of field.value.properties) {
      // 6a. 处理 ObjectProperty（inherit/data/store 中的键值对）
      if (isObjectProperty(subField)) {
        const subName = getKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        collectSubFieldData(fieldName, subName, subField.value, info);
      } // 6b. 处理 ObjectMethod（computed/events 中的简写方法）
      else if (isObjectMethod(subField)) {
        const subName = getObjectMethodKeyName(subField);
        if (subName === undefined || subName.startsWith(innerPrefix)) continue;
        collectSubMethodData(fieldName, subName, subField, info);
      }
    }
  }

  // 7. 写入结果映射表
  subComponentInfoRecord[variableName] = info;
}

// ---- inherit 字段专用：解析属性值为 AttrValue ----

/**
 * 将 inherit 字段的属性值节点解析为 AttrValue
 *
 * 支持的节点类型：
 * - StringLiteral("wxml") → Custom（自定义传值，无法静态推断）
 * - StringLiteral("root.path") → Root（根数据路径引用）
 * - ArrayExpression(["a", "b"]) → Union（联合类型）
 */
function getInheritValue(
  valueElement: StringLiteral | Identifier | ArrayExpression,
): Custom | Root | Union {
  if (isStringLiteral(valueElement)) {
    if (valueElement.value === "wxml") {
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
  throw Error(`getInheritValue: 意外的节点类型 ${valueElement.type}`);
}

// ---- 字段数据收集（ObjectProperty 形式）----

/**
 * 收集 ObjectProperty 形式的子组件字段数据
 *
 * @param fieldName - 顶层字段名（inherit/data/computed/store/events）
 * @param subName - 子字段名
 * @param value - 子字段的值节点
 * @param info - 子组件信息，原地修改
 */
// eslint-disable-next-line complexity
function collectSubFieldData(
  fieldName: string,
  subName: string,
  value: ObjectProperty["value"],
  info: SubComponentInfo,
): void {
  switch (fieldName) {
    case "inherit":
      // inherit 字段 → 根据值类型生成对应的 AttrValue
      try {
        info.configInfo[subName] = getInheritValue(value as StringLiteral | Identifier | ArrayExpression);
      } catch {
        // 无法识别的 inherit 值，跳过
      }
      break;
    case "events":
      // 事件字段 → configInfo 采用旧 CustomComponent 约定：
      // - xxx → bind:xxx
      // - xxx_catch → catch:xxx（去掉 _catch 后缀）
      {
        const realAttr = stripPrefix(subName);
        addEventToConfigInfo(info, subName, realAttr);
      }
      break;
    case "data":
      // data 字段 → configInfo 记录 Self，加入 dataList，并检测数组/布尔类型
      info.configInfo[subName] = { type: "Self", value: subName };
      info.dataList.push(subName);
      if (isArrayType(value)) info.arrTypeDatas.push(subName);
      if (isBoolType(value)) info.boolTypeDatas.push(subName);
      break;
    case "computed":
    case "store":
      // computed/store → configInfo 记录 Self，加入 dataList
      info.configInfo[subName] = { type: "Self", value: subName };
      info.dataList.push(subName);
      // computed/store 中可能以箭头函数形式定义，检查返回类型
      if (isArrayTypeFunction(value)) info.arrTypeDatas.push(subName);
      if (isBoolTypeFunction(value)) info.boolTypeDatas.push(subName);
      break;
  }
}

// ---- 字段数据收集（ObjectMethod 形式）----

/**
 * 收集 ObjectMethod 形式的子组件字段数据（computed、events 中的简写方法）
 */
function collectSubMethodData(
  fieldName: string,
  subName: string,
  method: ObjectMethod,
  info: SubComponentInfo,
): void {
  switch (fieldName) {
    case "events":
      // 事件方法 → configInfo 采用旧 CustomComponent 约定（同 collectSubFieldData）
      {
        const realAttr = stripPrefix(subName);
        addEventToConfigInfo(info, subName, realAttr);
      }
      break;
    case "computed": {
      info.configInfo[subName] = { type: "Self", value: subName };
      info.dataList.push(subName);
      // 通过方法的返回类型注解推断数组/布尔类型
      const returnType = method.returnType?.typeAnnotation;
      if (returnType && isTSArrayType(returnType)) info.arrTypeDatas.push(subName);
      if (returnType && isTSBooleanKeyword(returnType)) info.boolTypeDatas.push(subName);
      break;
    }
  }
}

// ---- 事件工具函数 ----

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

/**
 * 将事件名写入 configInfo，遵循旧 CustomComponent 约定：
 * - xxx → configInfo key 为 bind:xxx
 * - xxx_catch → configInfo key 为 catch:xxx（去掉 _catch 后缀）
 * 同时将原始方法名加入 events 列表
 */
function addEventToConfigInfo(
  info: SubComponentInfo,
  rawName: string,
  realAttr: string,
): void {
  if (realAttr.endsWith("_catch")) {
    // _catch 后缀 → catch: 前缀事件
    const eventName = realAttr.slice(0, -6); // 去掉 "_catch"
    info.configInfo[`catch:${eventName}`] = { type: "Events", value: rawName } satisfies Events;
  } else {
    info.configInfo[`bind:${realAttr}`] = { type: "Events", value: rawName } satisfies Events;
  }
  info.events.push(rawName);
}

// ---- 键名提取 ----

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

// ---- 类型守卫 ----

/** 判断节点是否为数组类型（字面量数组 / TSArrayType / Identifier("Array")） */
function isArrayType(node: Node): boolean {
  return isArrayExpression(node)
    || isTSArrayType(node)
    || (isIdentifier(node) && node.name === "Array");
}

/** 判断节点是否为布尔类型（BooleanLiteral / TSBooleanKeyword / Identifier("Boolean")） */
function isBoolType(node: Node): boolean {
  return isBooleanLiteral(node)
    || isTSBooleanKeyword(node)
    || (isIdentifier(node) && node.name === "Boolean");
}

/** 判断箭头函数返回值是否为数组类型 */
function isArrayTypeFunction(node: Node): boolean {
  return isArrowFunctionExpression(node)
    && node.returnType?.type === "TSTypeAnnotation"
    && isTSArrayType(node.returnType.typeAnnotation);
}

/** 判断箭头函数返回值是否为布尔类型 */
function isBoolTypeFunction(node: Node): boolean {
  return isArrowFunctionExpression(node)
    && node.returnType?.type === "TSTypeAnnotation"
    && isTSBooleanKeyword(node.returnType.typeAnnotation);
}
