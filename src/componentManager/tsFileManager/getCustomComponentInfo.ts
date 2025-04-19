// /* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { generateCustomCompConfigInfo } from "./generateCustomCompInfo";
// import type { CustomComponentInfo } from "./types";

// export function getCustomComponentInfo(
//   variableDeclarator: any,
// ): CustomComponentInfo | null {
//   const node = variableDeclarator.node as any;
//   const nodeInit = node.init;
//   if (nodeInit?.type !== "CallExpression") return null;
//   if (nodeInit.callee.type !== "CallExpression") return null;
//   if (nodeInit.callee.callee.type !== "Identifier") return null; // 排除非想要的函数调用
//   const funcName = nodeInit.callee.callee.name;
//   // 提取所有SubComponent函数中的数据和事件
//   if (funcName === "CustomComponent") {

//     const variableName = variableDeclarator.node.id.name;
//     const typeName = variableDeclarator.node.init.callee?.typeParameters?.params[1]?.typeName
//       ?.name;

//     return generateCustomCompConfigInfo(nodeInit);
//   }

//   return null;
// }
