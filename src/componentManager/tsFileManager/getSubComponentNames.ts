/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ParseResult } from "@babel/parser";
import traverse from "@babel/traverse";
import type { File, Identifier } from "@babel/types";

// 提取ast中是通过变量声明的方式调用的DefineComponent函数中的subComponents字段中的所有item的名称

/**
 * 获取tsFileAST中 DefineComponent函数中subComponents字段中所有item的名称(字符串),比如下面的结果应该为 [ "subA", "subB", "subC", "subD", "subE"]
 * ```ts
 * DefineComponent({
 *  name: "missing",
 *  rootComponent,
 *  subComponents: [subA, subB, subC, subD, subE],
 * });
 * ```
 */
export function getSubComponentNames(tsFileAST: ParseResult<File>): string[] {
  const subComponentNames: string[] = [];
  traverse(tsFileAST, {
    CallExpression(path) {
      const expression = path.node.callee as any;
      if (expression?.type !== "Identifier") return;
      const funcName = expression.name;
      // 提取所有SubComponent函数中的数据和事件
      if (funcName === "DefineComponent") {
        const subComponents = (path.node.arguments[0] as any)?.properties?.find(
          (property: any) => property.key.name === "subComponents",
        )?.value?.elements;
        if (subComponents !== undefined) {
          subComponentNames.push(...subComponents.map((element: Identifier) => (element as Identifier).name));
        }
      }
    },
  });

  return subComponentNames;
}
