/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodePath } from "@babel/traverse";
import { VariableDeclarator } from "@babel/types";
import { generateComponentInfo } from "./generateRootCompInfo";
import type { RootComponentInfo } from "./types";

export function getRootComponentInfo(
  variableDeclarator: NodePath<VariableDeclarator>,
): RootComponentInfo | undefined {
  const node = variableDeclarator.node as any;
  const nodeInit = node.init;
  if (nodeInit?.type !== "CallExpression") return;
  if (nodeInit.callee.type !== "CallExpression") return;
  if (nodeInit.callee.callee.type !== "Identifier") return; // 排除非想要的函数调用
  const funcName = nodeInit.callee.callee.name;
  // 提取所有SubComponent函数中的数据和事件
  if (funcName === "RootComponent") {
    return generateComponentInfo(nodeInit);
  }
}
