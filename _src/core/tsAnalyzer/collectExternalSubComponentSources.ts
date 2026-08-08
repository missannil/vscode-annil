import type { CustomComponentInfo, ImportedSubComponentSourceRecord } from "../types/TsFileInfo.js";
import type { TraverseAstResult } from "./index.js";
import { resolveImportedTsPath } from "./tsConfigResolver.js";

export type { TraverseAstResult } from "./index.js";

/** 按文件路径解析 TS 文件组件信息的回调。 */
export type ParseTsFile = (fsPath: string) => Promise<TraverseAstResult>;

export type ExternalComponentInfo = {
  customComponentInfoRecord: TraverseAstResult["customComponentInfoRecord"];
  chunkComponentInfoRecord: TraverseAstResult["chunkComponentInfoRecord"];
  importedSubComponentSourceRecord: ImportedSubComponentSourceRecord;
};

function stripComponentPrefix(name: string): string {
  const match = name.match(/[^_]*_(.*)/);

  return match?.[1] ?? name;
}

/** 将外部 CustomComponent 的内部字段名转换为 WXML 对外属性名。 */
function normalizeExternalComponentInfo(info: CustomComponentInfo): CustomComponentInfo {
  const configInfo = Object.fromEntries(
    Object.entries(info.configInfo).map(([name, value]) => [stripComponentPrefix(name), value]),
  );

  return { ...info, configInfo };
}

/**
 * 收集当前页面有效的子组件类型导入源。
 *
 * 子组件变量可能定义在当前 TS 文件（已由 importedSubComponentSourceRecord 提供），
 * 也可能定义在外部文件并通过值导入参与 DefineComponent.subComponents。
 * 对外部定义：先定位变量所在文件，再通过 CustomComponent<Root, $X> 的第二个
 * 泛型参数 $X 找到其 `import type` 的模块路径。
 */
export async function collectExternalSubComponentSources(
  tsFsPath: string,
  tsInfo: TraverseAstResult,
  parseFile: ParseTsFile,
): Promise<ImportedSubComponentSourceRecord> {
  const componentInfo = await collectExternalComponentInfo(tsFsPath, tsInfo, parseFile);

  return componentInfo.importedSubComponentSourceRecord;
}

/** 收集外部定义的组件信息，供 JSON 和 WXML 校验共同使用。 */
export async function collectExternalComponentInfo(
  tsFsPath: string,
  tsInfo: TraverseAstResult,
  parseFile: ParseTsFile,
): Promise<ExternalComponentInfo> {
  const sources: ImportedSubComponentSourceRecord = { ...tsInfo.importedSubComponentSourceRecord };
  const customComponentInfoRecord = { ...tsInfo.customComponentInfoRecord };
  const chunkComponentInfoRecord = { ...tsInfo.chunkComponentInfoRecord };
  const visited = new Set<string>([tsFsPath]);

  for (const [localName, moduleSource] of Object.entries(tsInfo.importedComponentSourceRecord)) {
    const importedFsPath = resolveImportedTsPath(tsFsPath, moduleSource);
    if (importedFsPath === undefined || visited.has(importedFsPath)) continue;
    visited.add(importedFsPath);

    const importedInfo = await parseFile(importedFsPath);
    const importedCustomComponentInfoRecord = Object.fromEntries(
      Object.entries(importedInfo.customComponentInfoRecord).map(([name, info]) => [
        name,
        info === undefined ? undefined : normalizeExternalComponentInfo(info),
      ]),
    );
    Object.assign(customComponentInfoRecord, importedCustomComponentInfoRecord);
    Object.assign(chunkComponentInfoRecord, importedInfo.chunkComponentInfoRecord);
    const typeName = importedInfo.customComponentInfoRecord[localName]?.componentTypeName;
    if (typeName === undefined) continue;
    const typeSource = importedInfo.importedTypeSources[typeName];
    if (typeSource === undefined) continue;
    sources[localName] = typeSource;
  }

  return {
    customComponentInfoRecord,
    chunkComponentInfoRecord,
    importedSubComponentSourceRecord: sources,
  };
}
