import { vscode } from "#deps";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import type { Node } from "@babel/types";
import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isObjectMethod,
  isObjectPattern,
  isObjectProperty,
  isStringLiteral,
  isThisExpression,
  isVariableDeclarator,
  type ObjectMethod,
  type ObjectProperty,
} from "@babel/types";
import type { Diagnostic, Position } from "vscode";

export const UnusedDataDiagnosticCode = {
  unusedData: "annil.unusedData",
  suggestInternal: "annil.suggestInternalData",
} as const;

type ComponentKind = "RootComponent" | "CustomComponent" | "ChunkComponent";

type Declaration = {
  name: string;
  kind: ComponentKind;
  internal: boolean;
  start: Position;
  end: Position;
  memberStart: number;
  memberEnd: number;
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
  externalTexts: readonly string[] = [],
): Diagnostic[] {
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  const declarations: Declaration[] = [];
  const references = new Set<string>();
  const inheritReferences = new Set<string>();
  const watcherReferences = new Set<string>();

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
      const fields = ["properties", "data", "computed", "store", "watch"];

      for (const field of init.arguments[0].properties) {
        if (!isObjectProperty(field) || !isIdentifier(field.key) || !fields.includes(field.key.name)) continue;
        if (!isObjectExpression(field.value)) continue;
        if (field.key.name === "watch") {
          for (const watcher of field.value.properties) {
            const watcherName = isObjectProperty(watcher)
              ? getPropertyName(watcher)
              : isObjectMethod(watcher)
              ? getMethodName(watcher)
              : undefined;
            if (watcherName !== undefined) watcherReferences.add(watcherName);
          }
          continue;
        }
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
              memberStart: member.start ?? 0,
              memberEnd: member.end ?? member.start ?? 0,
            });
          }
        }
      }
    },
  });

  const allNames = new Set(declarations.map((declaration) => declaration.name));
  for (const watcherName of watcherReferences) {
    if (allNames.has(watcherName)) references.add(watcherName);
  }
  collectReferences(ast, allNames, references, inheritReferences);
  for (const externalText of externalTexts) {
    collectReferences(
      parse(externalText, { sourceType: "module", plugins: ["typescript"] }),
      allNames,
      references,
      inheritReferences,
    );
  }

  return declarations.flatMap((declaration) => {
    const usedInTs = references.has(declaration.name);
    const usedExternally = wxmlUsedNames.has(declaration.name) || inheritReferences.has(declaration.name);
    const diagnosticKind = getDiagnosticKind(declaration, usedInTs, usedExternally);
    if (diagnosticKind === undefined) return [];
    if (isFileDisabled(text, diagnosticKind) || isDisabled(text, declaration.memberStart, diagnosticKind)) return [];

    return [createDiagnostic(declaration, text, diagnosticKind)];
  });
}

/**
 * 收集对组件字段的引用。只识别确定访问组件数据的语法：
 *
 * - `this.xxx` / `this.data.xxx` / `this.data["xxx"]`：组件方法内读取数据；
 * - `const { xxx } = this.data`：解构读取数据（其他来源的解构不算）；
 * - `inherit: { field: "rootField" }`：子组件继承 Root 字段（数组候选值不算）。
 *
 * import 绑定、函数参数、局部变量、其他对象的属性虽然同名，但不构成对
 * 组件字段的引用，不能作为“已使用”依据。
 */
function collectReferences(
  ast: Node,
  names: ReadonlySet<string>,
  references: Set<string>,
  inheritReferences: Set<string>,
): void {
  traverse(ast, {
    // eslint-disable-next-line complexity
    VariableDeclarator(path) {
      const init = path.node.init;
      if (!isCallExpression(init) || !isCallExpression(init.callee)) return;
      const componentCallee = init.callee.callee;
      if (!isIdentifier(componentCallee) || componentCallee.name !== "CustomComponent") return;
      const config = init.arguments[0];
      if (!isObjectExpression(config)) return;

      for (const field of config.properties) {
        if (!isObjectProperty(field) || !isIdentifier(field.key) || field.key.name !== "watch") continue;
        if (!isObjectExpression(field.value)) continue;
        for (const watcher of field.value.properties) {
          const watcherName = isObjectProperty(watcher)
            ? getPropertyName(watcher)
            : isObjectMethod(watcher)
            ? getMethodName(watcher)
            : undefined;
          if (watcherName !== undefined && names.has(watcherName)) references.add(watcherName);
        }
      }
    },
    MemberExpression(path) {
      const property = path.node.property;
      const name = isIdentifier(property) ? property.name : isStringLiteral(property) ? property.value : undefined;
      if (name === undefined || !names.has(name)) return;

      const object = path.node.object;
      // `this.xxx`
      if (isThisExpression(object)) {
        references.add(name);

        return;
      }
      // `this.data.xxx`（内层 `this.data` 的属性名不是字段，不会重复收集）
      if (
        isMemberExpression(object) && isThisExpression(object.object)
        && isIdentifier(object.property) && object.property.name === "data"
      ) {
        references.add(name);
      }
    },
    // eslint-disable-next-line complexity
    ObjectProperty(path) {
      // `const { xxx } = this.data`
      if (!isObjectPattern(path.parentPath?.node)) return;
      const declarator = path.parentPath?.parentPath?.node;
      if (!isVariableDeclarator(declarator)) return;
      const init = declarator.init;
      if (
        !isMemberExpression(init) || !isThisExpression(init.object)
        || !isIdentifier(init.property) || init.property.name !== "data"
      ) {
        return;
      }
      const key = path.node.key;
      const name = isIdentifier(key) ? key.name : isStringLiteral(key) ? key.value : undefined;
      if (name !== undefined && names.has(name)) references.add(name);
    },
    StringLiteral(path) {
      if (!isInInherit(path)) return;
      // `inherit: { attr: ["a", "b"] }` 中的数组是候选值集合，
      // 只有 WXML 实际绑定其一（计入 wxmlUsedNames）才算使用。
      if (isArrayExpression(path.parentPath?.node)) return;
      if (names.has(path.node.value)) inheritReferences.add(path.node.value);
    },
  });
}

function shouldDeclare(kind: ComponentKind, name: string, innerPrefix: string): boolean {
  return kind === "RootComponent" || kind === "ChunkComponent" || name.startsWith(innerPrefix);
}

function getDiagnosticKind(
  declaration: Declaration,
  usedInTs: boolean,
  usedExternally: boolean,
): "unused" | "suggestInternal" | undefined {
  if (declaration.kind === "RootComponent" && !declaration.internal) {
    if (usedExternally) return undefined;

    return usedInTs ? "suggestInternal" : "unused";
  }
  if (usedInTs || usedExternally) return undefined;

  return "unused";
}

function isFileDisabled(text: string, diagnosticKind: "unused" | "suggestInternal"): boolean {
  const disabledName = diagnosticKind === "suggestInternal" ? "suggestInternalData" : "unusedData";
  const prefix = `// annil disable ${disabledName}`;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("//")) {
      if (trimmed === prefix || trimmed.startsWith(`${prefix} `)) return true;
      continue;
    }
    break;
  }

  return false;
}

function isDisabled(
  text: string,
  memberStart: number,
  diagnosticKind: "unused" | "suggestInternal",
): boolean {
  const memberLineStart = text.lastIndexOf("\n", memberStart - 1) + 1;
  if (memberLineStart === 0) return false;
  const previousLineEnd = memberLineStart - 1;
  const previousLineStart = text.lastIndexOf("\n", previousLineEnd - 1) + 1;
  const previousLine = text.slice(previousLineStart, previousLineEnd).trim();
  const disabledName = diagnosticKind === "suggestInternal" ? "suggestInternalData" : "unusedData";
  const prefix = `// annil disable ${disabledName}`;

  return previousLine === prefix || previousLine.startsWith(`${prefix} `);
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

function isInInherit(path: { findParent: (callback: (parent: { node: Node }) => boolean) => unknown }): boolean {
  return path.findParent((parent) =>
    isObjectProperty(parent.node) && isIdentifier(parent.node.key) && parent.node.key.name === "inherit"
  ) != null;
}

function toPosition(position: { line: number; column: number } | null | undefined): Position {
  return new vscode.Position((position?.line ?? 1) - 1, position?.column ?? 0);
}

function createDiagnostic(
  declaration: Declaration,
  text: string,
  kind: "unused" | "suggestInternal",
): Diagnostic {
  const line = text.split("\n")[declaration.start.line] ?? "";
  const leadingWhitespace = line.match(/^\s*/)?.[0].length ?? 0;
  const start = leadingWhitespace > 0
    ? new vscode.Position(declaration.start.line, 0)
    : declaration.start;
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(start, new vscode.Position(declaration.start.line, leadingWhitespace)),
    kind === "suggestInternal" ? "建议改为内部字段" : "未使用到的数据",
    vscode.DiagnosticSeverity.Warning,
  );
  diagnostic.source = "vscode-annil";
  diagnostic.code = kind === "suggestInternal"
    ? UnusedDataDiagnosticCode.suggestInternal
    : UnusedDataDiagnosticCode.unusedData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (diagnostic as any).info = {
    name: declaration.name,
    memberStart: declaration.memberStart,
    memberEnd: declaration.memberEnd,
    kind: declaration.kind,
  };

  return diagnostic;
}
