import { fs, jsonc, path } from "#deps";
import type { ImportedSubComponentSourceRecord } from "../types/TsFileInfo.js";

type TsConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

type ProjectConfig = {
  miniprogramRoot?: string;
};

function findNearestFile(startDirectory: string, fileName: string): string | undefined {
  let directory = startDirectory;

  while (true) {
    const candidate = path.join(directory, fileName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

function readJsonc<T>(fsPath: string): T | undefined {
  try {
    return jsonc.parse(fs.readFileSync(fsPath, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

function stripExtension(fsPath: string): string {
  return fsPath.slice(0, Math.max(fsPath.lastIndexOf("."), 0));
}

// eslint-disable-next-line complexity
function resolveModuleSource(source: string, tsConfigPath: string): string | undefined {
  const config = readJsonc<TsConfig>(tsConfigPath);
  const compilerOptions = config?.compilerOptions;
  if (compilerOptions === undefined) return undefined;
  const configDirectory = path.dirname(tsConfigPath);
  const resolutionBase = compilerOptions.baseUrl === undefined
    ? configDirectory
    : path.resolve(configDirectory, compilerOptions.baseUrl);
  const paths = compilerOptions.paths;

  if (paths !== undefined) {
    for (const [pattern, targets] of Object.entries(paths)) {
      const starIndex = pattern.indexOf("*");
      const prefix = starIndex === -1 ? pattern : pattern.slice(0, starIndex);
      const suffix = starIndex === -1 ? "" : pattern.slice(starIndex + 1);
      if (!source.startsWith(prefix) || !source.endsWith(suffix)) continue;
      const wildcard = source.slice(prefix.length, source.length - suffix.length);
      const target = targets[0];
      if (target === undefined) continue;

      return path.resolve(resolutionBase, target.replace("*", wildcard));
    }
  }

  return compilerOptions.baseUrl === undefined ? undefined : path.resolve(resolutionBase, source);
}

/**
 * 将 TS `import type` 的模块路径转换为 JSON `usingComponents` 路径。
 * 无法映射到当前小程序根目录的导入（例如 npm 类型）不会进入 JSON 契约。
 */
export function resolveImportedSubComponentPaths(
  tsFsPath: string,
  sourceRecord: ImportedSubComponentSourceRecord,
): Record<string, string> {
  const projectConfigPath = findNearestFile(path.dirname(tsFsPath), "project.config.json");
  if (projectConfigPath === undefined) return {};
  const projectConfig = readJsonc<ProjectConfig>(projectConfigPath);
  if (projectConfig?.miniprogramRoot === undefined) return {};
  const miniprogramRoot = path.resolve(path.dirname(projectConfigPath), projectConfig.miniprogramRoot);
  const tsConfigPath = findNearestFile(path.dirname(tsFsPath), "tsconfig.json");
  const result: Record<string, string> = {};

  for (const [componentName, source] of Object.entries(sourceRecord)) {
    const absolutePath = (Boolean(source.startsWith(".")))
      ? path.resolve(path.dirname(tsFsPath), source)
      : tsConfigPath === undefined
      ? undefined
      : resolveModuleSource(source, tsConfigPath);
    if (absolutePath === undefined) continue;

    const relativePath = path.relative(miniprogramRoot, stripExtension(absolutePath));
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) continue;
    result[componentName] = `/${relativePath.split(path.sep).join("/")}`;
  }

  return result;
}
