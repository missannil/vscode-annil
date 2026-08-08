import { vscode } from "#deps";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { Node } from "@babel/types";
import {
  isCallExpression,
  isIdentifier,
  isObjectExpression,
  isObjectMethod,
  isObjectProperty,
  isStringLiteral,
  type ObjectMethod,
  type ObjectProperty,
} from "@babel/types";
import type { Diagnostic, Position } from "vscode";

export const UnusedDataDiagnosticCode = {
  unusedData: "annil.unusedData",
} as const;

type ComponentKind = "RootComponent" | "CustomComponent" | "ChunkComponent";

type Declaration = {
  name: string;
  kind: ComponentKind;
  internal: boolean;
  start: Position;
  end: Position;
};

/**
 * 检查组件数据是否被 TS 或对应 WXML 使用。
 *
 * CustomComponent 只检查内部字段；RootComponent 和 ChunkComponent 检查全部字段。
 * WXML 使用集合由 checkWxml 收集，无法静态确定的表达式不会被当作未使用依据。
 */
export function diagnoseUnusedData(
  text: string,
  innerDataPrefix: string,
  wxmlUsedNames: ReadonlySet<string>,
): Diagnostic[] {
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  const declarations: Declaration[] = [];
  const references = new Set<string>();

  traverse(ast, {
    // eslint-disable-next-line complexity
    VariableDeclarator(path) {
      const init = path.node.init;
      if (!isCallExpression(init) || !isCallExpression(init.callee)) return;
      const topCallee = init.callee.callee;
      if (!isIdentifier(topCallee)) return;
      if (
        topCallee.name !== "RootComponent" && topCallee.name !== "CustomComponent"
        && topCallee.name !== "ChunkComponent"
      ) {
        return;
      }
      if (!isObjectExpression(init.arguments[0])) return;
      const kind = topCallee.name as ComponentKind;
      const fields = ["properties", "data", "computed", "store"];

      for (const field of init.arguments[0].properties) {
        if (!isObjectProperty(field) || !isIdentifier(field.key) || !fields.includes(field.key.name)) continue;
        if (!isObjectExpression(field.value)) continue;
        for (const member of field.value.properties) {
          const memberName = isObjectProperty(member)
            ? getPropertyName(member)
            : isObjectMethod(member)
            ? getMethodName(member)
            : undefined;
          if (memberName === undefined) continue;
          if (shouldDeclare(kind, memberName, innerDataPrefix)) {
            const key = isObjectProperty(member) || isObjectMethod(member) ? member.key : undefined;
            if (key === undefined) continue;
            declarations.push({
              name: memberName,
              kind,
              internal: memberName.startsWith(innerDataPrefix),
              start: toPosition(key.loc?.start),
              end: toPosition(key.loc?.end),
            });
          }
        }
      }
    },
  });

  const allNames = new Set(declarations.map((declaration) => declaration.name));
  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;
      if (!allNames.has(name) || isDeclarationKey(path)) return;
      references.add(name);
    },
    StringLiteral(path) {
      if (!isInInherit(path)) return;
      if (allNames.has(path.node.value)) references.add(path.node.value);
    },
  });

  return declarations
    .filter((declaration) => declaration.kind !== "CustomComponent" || declaration.internal)
    .filter((declaration) => {
      const usedInTs = references.has(declaration.name);
      const usedInWxml = declaration.kind !== "CustomComponent" && wxmlUsedNames.has(declaration.name);

      return !usedInTs && !usedInWxml;
    })
    .map((declaration) => createDiagnostic(declaration, text));
}

function shouldDeclare(kind: ComponentKind, name: string, innerPrefix: string): boolean {
  return kind !== "CustomComponent" || name.startsWith(innerPrefix);
}

function getPropertyName(property: ObjectProperty): string | undefined {
  if (isIdentifier(property.key)) return property.key.name;
  if (isStringLiteral(property.key)) return property.key.value;

  return undefined;
}

function getMethodName(method: ObjectMethod): string | undefined {
  if (isIdentifier(method.key)) return method.key.name;
  if (isStringLiteral(method.key)) return method.key.value;

  return undefined;
}

function isDeclarationKey(path: { node: Node; parentPath?: { node?: Node } }): boolean {
  const parent = path.parentPath?.node;
  if (isObjectProperty(parent) || isObjectMethod(parent)) return parent.key === path.node;

  return false;
}

function isInInherit(path: { findParent: (callback: (parent: { node: Node }) => boolean) => unknown }): boolean {
  return path.findParent((parent) =>
    isObjectProperty(parent.node) && isIdentifier(parent.node.key) && parent.node.key.name === "inherit"
  ) != null;
}

function toPosition(position: { line: number; column: number } | null | undefined): Position {
  return new vscode.Position((position?.line ?? 1) - 1, position?.column ?? 0);
}

function createDiagnostic(declaration: Declaration, text: string): Diagnostic {
  const line = text.split("\n")[declaration.start.line] ?? "";
  const leadingWhitespace = line.match(/^\s*/)?.[0].length ?? 0;
  const start = leadingWhitespace > 0
    ? new vscode.Position(declaration.start.line, 0)
    : declaration.start;
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(start, new vscode.Position(declaration.start.line, leadingWhitespace)),
    "未使用到的数据",
    vscode.DiagnosticSeverity.Warning,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = UnusedDataDiagnosticCode.unusedData;

  return diagnostic;
}
