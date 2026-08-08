import { path } from "#deps";
import type { ImportedSubComponentSourceRecord } from "../types/TsFileInfo.js";
import { findNearestFile, getMiniprogramRoot, readJsonc, resolveModuleSource } from "./tsConfigResolver.js";

type AppConfig = {
  resolveAlias?: Record<string, string>;
};

function resolveAppAlias(source: string, aliases: Record<string, string>): string | undefined {
  const matchedAlias = Object.keys(aliases)
    .filter((alias) => alias.endsWith("*") && source.startsWith(alias.slice(0, -1)))
    .sort((left, right) => right.length - left.length)[0];
  if (matchedAlias === undefined) return undefined;

  const aliasPrefix = matchedAlias.slice(0, -1);
  const target = aliases[matchedAlias];
  if (target === undefined) return undefined;

  const targetPrefix = target.endsWith("*") ? target.slice(0, -1) : target;
  const resolved = `${targetPrefix}${source.slice(aliasPrefix.length)}`;

  return resolved.startsWith("/") ? resolved : `/${resolved}`;
}

function stripExtension(fsPath: string): string {
  const extension = path.extname(fsPath);

  return extension === "" ? fsPath : fsPath.slice(0, -extension.length);
}

/**
 * 将 TS `import type` 的模块路径转换为 JSON `usingComponents` 路径。
 * 无法映射到当前小程序根目录的导入（例如 npm 类型）不会进入 JSON 契约。
 */
// eslint-disable-next-line complexity
export function resolveImportedSubComponentPaths(
  tsFsPath: string,
  sourceRecord: ImportedSubComponentSourceRecord,
): Record<string, string> {
  const miniprogramRoot = getMiniprogramRoot(tsFsPath);
  if (miniprogramRoot === undefined) return {};
  const tsConfigPath = findNearestFile(path.dirname(tsFsPath), "tsconfig.json");
  const appConfig = readJsonc<AppConfig>(path.join(miniprogramRoot, "app.json"));
  const result: Record<string, string> = {};

  for (const [componentName, source] of Object.entries(sourceRecord)) {
    const absolutePath = (Boolean(source.startsWith(".")))
      ? path.resolve(path.dirname(tsFsPath), source)
      : tsConfigPath === undefined
      ? undefined
      : resolveModuleSource(source, tsConfigPath);

    if (absolutePath !== undefined) {
      const relativePath = path.relative(miniprogramRoot, stripExtension(absolutePath));
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) continue;
      result[componentName] = `/${relativePath.split(path.sep).join("/")}`;
      continue;
    }

    const aliasedPath = appConfig?.resolveAlias === undefined
      ? undefined
      : resolveAppAlias(source, appConfig.resolveAlias);
    if (aliasedPath !== undefined) result[componentName] = aliasedPath.replace(/\.([cm]?tsx?|jsx?)$/, "");
  }

  return result;
}
