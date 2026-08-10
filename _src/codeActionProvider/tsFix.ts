import { fs, vscode } from "#deps";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { isIdentifier, isStringLiteral, isTSPropertySignature, type Node } from "@babel/types";
import { configuration } from "../configuration/index.js";
import { resolveImportedTsPath } from "../core/tsAnalyzer/tsConfigResolver.js";

function getInfo(diagnostic: vscode.Diagnostic): { name?: string; memberStart?: number; memberEnd?: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const info = (diagnostic as any).info as { name?: string; memberStart?: number; memberEnd?: number } | undefined;

  return info ?? {};
}

/** 删除未使用的完整组件字段成员，避免只删除字段名导致残留逗号或值。 */
// eslint-disable-next-line complexity
export function generateUnusedDataDeleteAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const { memberStart, memberEnd, name } = getInfo(diagnostic);
  if (memberStart === undefined || memberEnd === undefined) return undefined;

  const action = new vscode.CodeAction(`删除未使用数据 “${name ?? ""}”`, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();

  const startPosition = document.positionAt(memberStart);
  const lineStart = new vscode.Position(startPosition.line, 0);
  const source = document.getText();
  let endOffset = memberEnd;
  while (endOffset < source.length && /[ \t]/.test(source[endOffset] ?? "")) endOffset++;
  if (source[endOffset] === ",") {
    endOffset++;
    if (source[endOffset] === "\r") endOffset++;
    if (source[endOffset] === "\n") endOffset++;
  } else {
    const previousLineEnd = memberStart;
    const previousLineStart = source.lastIndexOf("\n", previousLineEnd - 1) + 1;
    const previousComma = source.lastIndexOf(",", previousLineStart);
    if (previousComma >= 0) {
      action.edit.delete(
        document.uri,
        new vscode.Range(document.positionAt(previousComma), document.positionAt(previousComma + 1)),
      );
    }
  }
  action.edit.delete(document.uri, new vscode.Range(lineStart, document.positionAt(endOffset)));
  const visited = new Set<string>([document.uri.fsPath]);
  addTypePropertyDeleteEdit(document.uri, source, name, action.edit);
  collectImportedTypePropertyDeleteEdits(document.uri.fsPath, source, name, action.edit, visited);

  return action;
}

/** 将 RootComponent 对外字段改为内部字段，并同步重命名 TS 中的所有同名标识符。 */
export function generateSuggestInternalAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const { name } = getInfo(diagnostic);
  if (name === undefined || name.startsWith(configuration.innerDataPrefix)) return undefined;

  const newName = `${configuration.innerDataPrefix}${name}`;
  const edit = new vscode.WorkspaceEdit();
  const visited = new Set<string>();
  addRenameEdits(document.uri, document.getText(), name, newName, edit, visited);
  collectImportedRenameEdits(document.uri.fsPath, document.getText(), name, newName, edit, visited);

  if (edit.entries().length === 0) return undefined;
  const action = new vscode.CodeAction(`改为内部字段 “${newName}”`, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = edit;

  return action;
}

function addRenameEdits(
  uri: vscode.Uri,
  text: string,
  oldName: string,
  newName: string,
  edit: vscode.WorkspaceEdit,
  visited: Set<string>,
): void {
  if (visited.has(uri.fsPath)) return;
  visited.add(uri.fsPath);
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  traverse(ast, {
    Identifier(path) {
      if (path.node.name !== oldName || path.node.start == null || path.node.end == null) return;
      // Babel 会为 `{ subGoods }` 的 key 和 value 各生成一个 Identifier，
      // 两者范围相同；只处理 value，避免同一位置被添加两次前缀。
      const parent = path.parentPath?.node;
      if (parent?.type === "ObjectProperty" && parent.shorthand && parent.key === path.node) return;
      edit.replace(
        uri,
        new vscode.Range(positionAt(text, path.node.start), positionAt(text, path.node.end)),
        newName,
      );
    },
    StringLiteral(path) {
      const parent = path.parentPath?.node;
      if (path.node.value !== oldName || parent?.type !== "ObjectProperty" || parent.key.type !== "Identifier") return;
      if (parent.key.name !== "inherit" || path.node.start == null || path.node.end == null) return;
      edit.replace(
        uri,
        new vscode.Range(positionAt(text, path.node.start), positionAt(text, path.node.end)),
        `"${newName}"`,
      );
    },
    TSPropertySignature(path) {
      if (!isTypePropertiesMember(path) || path.node.start == null || path.node.end == null) return;
      const propertyName = getTypePropertyName(path.node.key);
      if (propertyName === undefined || !propertyName.endsWith(`_${oldName}`)) return;
      const prefix = propertyName.slice(0, -oldName.length);
      const replacement = `${prefix}${newName}`;
      const keyStart = path.node.key.start;
      const keyEnd = path.node.key.end;
      if (keyStart == null || keyEnd == null) return;
      edit.replace(
        uri,
        new vscode.Range(positionAt(text, keyStart), positionAt(text, keyEnd)),
        replacement,
      );
    },
  });
}

function addTypePropertyDeleteEdit(
  uri: vscode.Uri,
  text: string,
  name: string | undefined,
  edit: vscode.WorkspaceEdit,
): void {
  if (name === undefined) return;
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  traverse(ast, {
    // eslint-disable-next-line complexity
    TSPropertySignature(path) {
      if (!isTypePropertiesMember(path) || path.node.start == null || path.node.end == null) return;
      const propertyName = getTypePropertyName(path.node.key);
      if (propertyName === undefined || !propertyName.endsWith(`_${name}`)) return;
      const memberStart = positionAt(text, path.node.start);
      const start = new vscode.Position(memberStart.line, 0);
      let endOffset = path.node.end;
      while (endOffset < text.length && /[ \t]/.test(text[endOffset] ?? "")) endOffset++;
      if (text[endOffset] === ";") endOffset++;
      if (text[endOffset] === "\r") endOffset++;
      if (text[endOffset] === "\n") endOffset++;
      edit.delete(uri, new vscode.Range(start, positionAt(text, endOffset)));
    },
  });
}

function collectImportedTypePropertyDeleteEdits(
  importingFsPath: string,
  text: string,
  name: string | undefined,
  edit: vscode.WorkspaceEdit,
  visited: Set<string>,
): void {
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  traverse(ast, {
    ImportDeclaration(path) {
      const importedPath = resolveImportedTsPath(importingFsPath, path.node.source.value);
      if (importedPath === undefined || visited.has(importedPath)) return;
      const importedDocument = vscode.workspace.textDocuments.find((candidate) =>
        candidate.uri.fsPath === importedPath
      );
      const importedText = importedDocument?.getText() ?? readFileSafe(importedPath);
      if (importedText === undefined) return;
      visited.add(importedPath);
      addTypePropertyDeleteEdit(vscode.Uri.file(importedPath), importedText, name, edit);
      collectImportedTypePropertyDeleteEdits(importedPath, importedText, name, edit, visited);
    },
  });
}

function isTypePropertiesMember(
  path: { findParent: (callback: (parent: { node: Node }) => boolean) => unknown },
): boolean {
  return path.findParent((parent) => {
    if (!isTSPropertySignature(parent.node)) return false;

    return getTypePropertyName(parent.node.key) === "properties";
  }) != null;
}

function getTypePropertyName(key: Node | null | undefined): string | undefined {
  if (isIdentifier(key)) return key.name;
  if (isStringLiteral(key)) return key.value;

  return undefined;
}

function collectImportedRenameEdits(
  importingFsPath: string,
  text: string,
  oldName: string,
  newName: string,
  edit: vscode.WorkspaceEdit,
  visited: Set<string>,
): void {
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"] });
  traverse(ast, {
    ImportDeclaration(path) {
      const importedPath = resolveImportedTsPath(importingFsPath, path.node.source.value);
      if (importedPath === undefined || visited.has(importedPath)) return;
      const importedUri = vscode.Uri.file(importedPath);
      const importedDocument = vscode.workspace.textDocuments.find((candidate) =>
        candidate.uri.fsPath === importedPath
      );
      // 防御：文件可能在解析后被删除或权限变化，单个文件失败不应中断整体修复。
      const importedText = importedDocument?.getText() ?? readFileSafe(importedPath);
      if (importedText === undefined) return;
      addRenameEdits(importedUri, importedText, oldName, newName, edit, visited);
      collectImportedRenameEdits(importedPath, importedText, oldName, newName, edit, visited);
    },
  });
}

function positionAt(text: string, offset: number): vscode.Position {
  let line = 0;
  let character = 0;
  for (let index = 0; index < offset; index++) {
    if (text[index] === "\n") {
      line++;
      character = 0;
    } else {
      character++;
    }
  }

  return new vscode.Position(line, character);
}

/** 安全读取文件文本，读取失败（目录、已删除、权限等）返回 undefined。 */
function readFileSafe(fsPath: string): string | undefined {
  try {
    return fs.readFileSync(fsPath, "utf-8");
  } catch {
    return undefined;
  }
}
