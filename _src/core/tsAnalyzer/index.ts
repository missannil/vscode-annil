import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { isCallExpression, isIdentifier } from "@babel/types";
import type { RootComponentInfo } from "../types/index.js";
import { collectRootComponentInfo } from "./rootComponentCollector.js";

export type TraverseAstResult = {
  rootComponentInfo: RootComponentInfo;
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
    // customEvents: [],
  };

  traverse(tsAST, {
    VariableDeclarator(variableDeclarator) {
      // 1. 获取变量声明赋值表达式的初始值节点，例如 const rootComponent = RootComponent()({ ... }),这里得到的node是 `RootComponent()({ ... })` 的 CallExpression 节点
      const node = variableDeclarator.node.init;
      // 2. 排除错误的节点(即错误的调用不会被收集)，例如 const rootComponent = 123, 这里的 node 是 NumericLiteral 节点
      if (!isCallExpression(node)) return;

      // 3. 只处理 annil 二次调用模式 RootComponent()({ ... })
      //    node.callee 必须为 CallExpression(Identifier("RootComponent"), [])，即 RootComponent() 部分
      if (!isCallExpression(node.callee)) return;

      // 4. 提取第一次调用的 callee，检查是否为 RootComponent 标识符
      const topCallee = node.callee.callee;
      if (!isIdentifier(topCallee)) return;
      if (topCallee.name !== "RootComponent") return;

      // 5. 从第二次调用表达式参数中收集根组件配置信息
      collectRootComponentInfo(node, rootComponentInfo, innerDataPrefix);
    },
  });

  return { rootComponentInfo };
}
