import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { CallExpression, Identifier } from "@babel/types";
import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isObjectExpression,
  isObjectProperty,
  isTSTypeReference,
} from "@babel/types";
import type { RootComponentInfo, SubComponentInfoRecord } from "../types/index.js";
import { collectRootComponentInfo } from "./rootComponentCollector.js";
import { collectSubComponentInfo } from "./subComponentCollector.js";

export type TraverseAstResult = {
  rootComponentInfo: RootComponentInfo;
  subComponentInfoRecord: SubComponentInfoRecord;
};

/**
 * 解析 TypeScript 源码 AST，提取组件配置信息
 *
 * 只做一次 AST 遍历，通过独立的 collector 函数收集不同 API 的数据。
 * 新增 API 支持时只需新增 collector 并添加到对应的 visitor 中，不改动现有逻辑。
 *
 * @param fsPath - 文件系统路径
 * @param text - TS 文件源码
 * @param innerDataPrefix - 内部字段前缀，匹配该前缀的字段不会被收集（默认 "_"）
 */

/** 从 SubComponent<Root, $X>()({...}) 泛型参数中提取第二个类型名 */
function extractSubComponentTypeName(callee: CallExpression): string | undefined {
  const typeArgs = callee.typeArguments;
  if (typeArgs == null || typeArgs.params[1] == null) return undefined;
  if (!isTSTypeReference(typeArgs.params[1])) return undefined;

  const typeRef = typeArgs.params[1];

  return isIdentifier(typeRef.typeName) ? typeRef.typeName.name : undefined;
}

/** 处理 SubComponent 变量声明：提取变量名 & 类型名，调用收集器 */
function handleSubComponent(
  id: Identifier,
  callee: CallExpression,
  expression: CallExpression,
  subComponentInfoRecord: SubComponentInfoRecord,
  fsPath: string,
  innerDataPrefix: string,
): void {
  collectSubComponentInfo(
    id.name,
    extractSubComponentTypeName(callee),
    expression,
    subComponentInfoRecord,
    fsPath,
    innerDataPrefix,
  );
}

export function traverseAst(
  fsPath: string,
  text: string,
  innerDataPrefix: string,
): TraverseAstResult {
  const tsAST = parse(text, { sourceType: "module", plugins: ["typescript"] });

  const rootComponentInfo: RootComponentInfo = {
    arrTypeDatas: [],
    boolTypeDatas: [],
    dataList: [],
    events: [],
  };

  const subComponentInfoRecord: SubComponentInfoRecord = {};
  // DefineComponent 中 subComponents 字段引用的子组件变量名集合
  const subComponentNames = new Set<string>();

  traverse(tsAST, {
    // eslint-disable-next-line complexity
    CallExpression(callPath) {
      // 收集 DefineComponent({ subComponents: [a, b, ...] }) 中的子组件名
      const callee = callPath.node.callee;
      if (!isIdentifier(callee) || callee.name !== "DefineComponent") return;

      const configArg = callPath.node.arguments[0];
      if (!isObjectExpression(configArg)) return;

      for (const prop of configArg.properties) {
        if (!isObjectProperty(prop)) continue;
        if (!isIdentifier(prop.key) || prop.key.name !== "subComponents") continue;
        if (!isArrayExpression(prop.value)) break;

        for (const element of prop.value.elements) {
          if (element && isIdentifier(element)) {
            subComponentNames.add(element.name);
          }
        }
      }
    },

    VariableDeclarator(variableDeclarator) {
      // 1. 获取变量声明赋值表达式的初始值节点，例如 const rootComponent = RootComponent()({ ... }),这里得到的node是 `RootComponent()({ ... })` 的 CallExpression 节点
      const node = variableDeclarator.node.init;
      // 2. 排除错误的节点(即错误的调用不会被收集)，例如 const rootComponent = 123, 这里的 node 是 NumericLiteral 节点
      if (!isCallExpression(node)) return;

      // 3. 只处理 annil 二次调用模式 XxxComponent()({ ... })
      //    node.callee 必须为 CallExpression(Identifier("XxxComponent"), [])，即 XxxComponent() 部分
      if (!isCallExpression(node.callee)) return;

      // 4. 提取第一次调用的 callee，检查是否为 annil 组件 API 标识符
      const topCallee = node.callee.callee;
      if (!isIdentifier(topCallee)) return;

      // 5. 根据 API 名称分发到对应的收集器
      if (topCallee.name === "RootComponent") {
        // 5a. 从第二次调用表达式参数中收集根组件配置信息
        collectRootComponentInfo(node, rootComponentInfo, innerDataPrefix);
      } else if (topCallee.name === "SubComponent") {
        // 5b. 收集子组件配置信息（统一了旧版 CustomComponent 和 ChunkComponent）
        if (!isIdentifier(variableDeclarator.node.id)) return;
        const id = variableDeclarator.node.id;
        handleSubComponent(id, node.callee, node, subComponentInfoRecord, fsPath, innerDataPrefix);
      }
    },
  });

  // 过滤：只保留 DefineComponent 中 subComponents 数组实际引用的 SubComponent
  if (subComponentNames.size > 0) {
    for (const name of Object.keys(subComponentInfoRecord)) {
      if (!subComponentNames.has(name)) {
        delete subComponentInfoRecord[name];
      }
    }
  }

  return { rootComponentInfo, subComponentInfoRecord };
}
