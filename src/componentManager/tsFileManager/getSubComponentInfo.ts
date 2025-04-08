/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NodePath } from "@babel/traverse";
import { VariableDeclarator } from "@babel/types";
import { generateCustomCompInfo } from "./generateCustomCompInfo";
import type { CustomComponentInfo } from "./types";

export function getCustomComponentInfo(
  variableDeclarator: NodePath<VariableDeclarator>,
  subComponentNames: string[],
): CustomComponentInfo | null {
  const node = variableDeclarator.node as any;
  const nodeInit = node.init;
  if (nodeInit?.type !== "CallExpression") return null;
  if (nodeInit.callee.type !== "CallExpression") return null;
  if (nodeInit.callee.callee.type !== "Identifier") return null; // 排除非想要的函数调用
  const funcName = nodeInit.callee.callee.name;
  // 提取所有SubComponent函数中的数据和事件
  if (funcName === "CustomComponent" && subComponentNames.includes(node.id.name)) {
    return generateCustomCompInfo(nodeInit);
    // if (isChunkComponent(nodeInit)) {
    //   const componentInfo = generateComponentInfo(nodeInit);
    //   // 这里需要删除customEvents字段,因为chunkComponent不需要这个字段
    //   Reflect.deleteProperty(componentInfo, "customEvents");

    //   return { type: "chunk", info: componentInfo };
    // } else {
    //   return {
    //     type: "custom",
    //     componentTypeName: nodeInit.callee?.typeParameters?.params[1]?.typeName?.name,
    //     info: generateCustomCompInfo(nodeInit),
    //   };
    // }
  }

  return null;
}
