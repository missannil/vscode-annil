import { fs, path, vscode } from "#deps";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { isCallExpression, isIdentifier, isObjectExpression, isObjectMethod, isObjectProperty } from "@babel/types";
import { tsParser } from "../core/fileManager/tsParser.js";
import type {
  ChunkComponentInfoRecord,
  CustomComponentInfoRecord,
  ImportedComponentSourceRecord,
} from "../core/types/TsFileInfo.js";
import { getSiblingUri, isComponentUri } from "../utils/uriHelper.js";

/** 注册 WXML 中 Annil CustomComponent 和 ChunkComponent 的声明跳转。 */
export function registerAnnilDefinitionProvider(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDefinitionProvider({ language: "wxml" }, {
    provideDefinition: async (document, position) => {
      if (!isComponentUri(document.uri)) return undefined;

      const tsUri = getSiblingUri(document.uri, ".ts");
      const tsInfo = await tsParser.tsParse(tsUri);
      const componentInfo = await collectComponentInfo(tsUri.fsPath, tsInfo);
      const customDefinition = getCustomComponentDefinition(
        document,
        position,
        componentInfo.customComponentInfoRecord,
      );
      if (customDefinition !== undefined) return customDefinition;

      const chunkDefinition = getChunkComponentDefinition(document, position, componentInfo.chunkComponentInfoRecord);
      if (chunkDefinition !== undefined) return chunkDefinition;

      return getDataDefinition(document, position, tsUri, tsInfo.rootComponentInfo.dataList);
    },
  });

  context.subscriptions.push(provider);
}

/** 返回光标所在 WXML 表达式的数据字段声明。 */
async function getDataDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  tsUri: vscode.Uri,
  dataList: string[],
): Promise<vscode.Location | undefined> {
  const wordRange = document.getWordRangeAtPosition(position);
  if (wordRange === undefined) return undefined;

  const word = document.getText(wordRange);
  if (!dataList.includes(word) || !isMustachePosition(document, position)) return undefined;

  const tsDocument = await vscode.workspace.openTextDocument(tsUri);
  const ast = parse(tsDocument.getText(), { sourceType: "module", plugins: ["typescript"] });
  let definition: vscode.Location | undefined;

  traverse(ast, {
    // eslint-disable-next-line complexity
    VariableDeclarator(variablePath) {
      if (definition !== undefined) return;

      const init = variablePath.node.init;
      if (!isCallExpression(init) || !isCallExpression(init.callee)) return;
      const callee = init.callee.callee;
      if (!isIdentifier(callee) || callee.name !== "RootComponent") return;

      const config = init.arguments[0];
      if (!isObjectExpression(config)) return;

      for (const field of config.properties) {
        if (!isObjectProperty(field) || !isIdentifier(field.key)) continue;
        if (!["properties", "data", "computed", "store"].includes(field.key.name)) continue;
        if (!isObjectExpression(field.value)) continue;

        for (const member of field.value.properties) {
          const name = isObjectProperty(member)
            ? getObjectMemberName(member.key)
            : isObjectMethod(member)
            ? getObjectMemberName(member.key)
            : undefined;
          const loc = member.loc;
          if (name !== word || loc === null || loc === undefined) continue;
          definition = new vscode.Location(
            tsUri,
            new vscode.Position(Math.max(loc.start.line - 1, 0), loc.start.column),
          );

          return;
        }
      }
    },
  });

  return definition;
}

function getObjectMemberName(key: unknown): string | undefined {
  if (typeof key !== "object" || key === null) return undefined;
  if ("name" in key && typeof key.name === "string") return key.name;
  if ("value" in key && typeof key.value === "string") return key.value;

  return undefined;
}

function isMustachePosition(document: vscode.TextDocument, position: vscode.Position): boolean {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const before = text.slice(0, offset);
  const after = text.slice(offset);

  return before.lastIndexOf("{{") > before.lastIndexOf("}}")
    && after.indexOf("}}") !== -1;
}

type ComponentInfo = {
  customComponentInfoRecord: CustomComponentInfoRecord;
  chunkComponentInfoRecord: ChunkComponentInfoRecord;
};

async function collectComponentInfo(fsPath: string, tsInfo: {
  customComponentInfoRecord: CustomComponentInfoRecord;
  chunkComponentInfoRecord: ChunkComponentInfoRecord;
  importedComponentSourceRecord: ImportedComponentSourceRecord;
}): Promise<ComponentInfo> {
  const customComponentInfoRecord = { ...tsInfo.customComponentInfoRecord };
  const chunkComponentInfoRecord = { ...tsInfo.chunkComponentInfoRecord };
  const visited = new Set([fsPath]);

  await collectImportedComponentInfo(
    fsPath,
    tsInfo.importedComponentSourceRecord,
    customComponentInfoRecord,
    chunkComponentInfoRecord,
    visited,
  );

  return { customComponentInfoRecord, chunkComponentInfoRecord };
}

async function collectImportedComponentInfo(
  importingFsPath: string,
  importedComponentSourceRecord: ImportedComponentSourceRecord,
  customComponentInfoRecord: CustomComponentInfoRecord,
  chunkComponentInfoRecord: ChunkComponentInfoRecord,
  visited: Set<string>,
): Promise<void> {
  for (const source of Object.values(importedComponentSourceRecord)) {
    const importedFsPath = resolveImportedTsPath(importingFsPath, source);
    if (importedFsPath === undefined || visited.has(importedFsPath)) continue;
    visited.add(importedFsPath);

    const importedInfo = await tsParser.tsParse(vscode.Uri.file(importedFsPath));
    Object.assign(customComponentInfoRecord, importedInfo.customComponentInfoRecord);
    Object.assign(chunkComponentInfoRecord, importedInfo.chunkComponentInfoRecord);
    await collectImportedComponentInfo(
      importedFsPath,
      importedInfo.importedComponentSourceRecord,
      customComponentInfoRecord,
      chunkComponentInfoRecord,
      visited,
    );
  }
}

function resolveImportedTsPath(importingFsPath: string, source: string): string | undefined {
  if (!source.startsWith(".")) return undefined;

  const sourcePath = path.resolve(path.dirname(importingFsPath), source);
  const candidates = [
    sourcePath.endsWith(".ts") ? sourcePath : `${sourcePath}.ts`,
    sourcePath.endsWith(".js") ? `${sourcePath.slice(0, -3)}.ts` : sourcePath,
    path.join(sourcePath, "index.ts"),
  ];

  // 只接受真正的文件，避免把同名目录解析为导入目标。
  return candidates.find(isFile);
}

function isFile(fsPath: string): boolean {
  try {
    return fs.statSync(fsPath).isFile();
  } catch {
    return false;
  }
}

function getCustomComponentDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  componentInfoRecord: CustomComponentInfoRecord,
): vscode.Location | undefined {
  const wordRange = document.getWordRangeAtPosition(position);
  if (wordRange === undefined) return undefined;

  const componentInfo = componentInfoRecord[document.getText(wordRange)];

  return componentInfo?.fsPath === undefined
    ? undefined
    : createLocation(componentInfo.fsPath, componentInfo.line);
}

function getChunkComponentDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
  componentInfoRecord: ChunkComponentInfoRecord,
): vscode.Location | undefined {
  const id = getStaticIdAtPosition(document, position);
  if (id === undefined) return undefined;

  const componentInfo = componentInfoRecord[id];

  return componentInfo === undefined ? undefined : createLocation(componentInfo.fsPath, componentInfo.line);
}

function createLocation(fsPath: string, line: number): vscode.Location {
  return new vscode.Location(vscode.Uri.file(fsPath), new vscode.Position(Math.max(line - 1, 0), 0));
}

/** 返回光标所在 opening tag 的静态 id 值；动态 id 和其他属性值不参与跳转。 */
function getStaticIdAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | undefined {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const tagStart = text.lastIndexOf("<", offset);
  const tagEnd = text.indexOf(">", offset);
  if (tagStart === -1 || tagEnd === -1 || tagStart > offset) return undefined;

  const tagText = text.slice(tagStart, tagEnd + 1);
  const idMatch = /\bid\s*=\s*(["'])([^"']*)\1/.exec(tagText);
  if (idMatch === null) return undefined;

  const valueStart = tagStart + idMatch.index + idMatch[0].indexOf(idMatch[2]);
  const valueEnd = valueStart + idMatch[2].length;

  return offset >= valueStart && offset <= valueEnd ? idMatch[2] : undefined;
}
