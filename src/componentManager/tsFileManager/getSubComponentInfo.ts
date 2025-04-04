/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodePath } from "@babel/traverse";
import { VariableDeclarator } from "@babel/types";
import { generateCustomCompInfo } from "./generateCustomCompInfo";
import { generateComponentInfo } from "./generateRootCompInfo";
import { isChunkComponent } from "./helper";
import type { SubComponentInfo } from "./types";

export function getSubComponentInfo(
  variableDeclarator: NodePath<VariableDeclarator>,
  subComponentNames: string[],
): SubComponentInfo | null {
  const node = variableDeclarator.node as any;
  const nodeInit = node.init;
  if (nodeInit?.type !== "CallExpression") return null;
  if (nodeInit.callee.type !== "CallExpression") return null;
  if (nodeInit.callee.callee.type !== "Identifier") return null; // 排除非想要的函数调用
  const funcName = nodeInit.callee.callee.name;
  // 提取所有SubComponent函数中的数据和事件
  if (funcName === "SubComponent" && subComponentNames.includes(node.id.name)) {
    if (isChunkComponent(nodeInit)) {
      const componentInfo = generateComponentInfo(nodeInit);
      // 这里需要删除customEvents字段,因为chunkComponent不需要这个字段
      Reflect.deleteProperty(componentInfo, "customEvents");

      return { type: "chunk", info: componentInfo };
    } else {
      return {
        type: "custom",
        componentTypeName: nodeInit.callee?.typeParameters?.params[1]?.typeName?.name,
        info: generateCustomCompInfo(nodeInit),
      };
    }
  }

  return null;
}
