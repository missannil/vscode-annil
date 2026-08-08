import { fs, jsonc, path } from "#deps";

type TsConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

type ProjectConfig = {
  miniprogramRoot?: string;
};

/** 从 startDirectory 向上查找最近的指定文件。 */
export function findNearestFile(startDirectory: string, fileName: string): string | undefined {
  let directory = startDirectory;

  while (true) {
    const candidate = path.join(directory, fileName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/** 读取 JSONC 文件并解析，失败返回 undefined。 */
export function readJsonc<T>(fsPath: string): T | undefined {
  try {
    return jsonc.parse(fs.readFileSync(fsPath, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

/**
 * 使用 tsconfig 的 baseUrl / paths 解析模块导入为绝对路径。
 * 无 paths 匹配时仅兼容仍声明 baseUrl 的旧项目；TS 7 新配置应显式使用 paths。
 */
// eslint-disable-next-line complexity
export function resolveModuleSource(source: string, tsConfigPath: string): string | undefined {
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

/** 查找组件文件所在小程序项目的 miniprogramRoot 绝对路径。 */
export function getMiniprogramRoot(componentFsPath: string): string | undefined {
  const projectConfigPath = findNearestFile(path.dirname(componentFsPath), "project.config.json");
  if (projectConfigPath === undefined) return undefined;
  const projectConfig = readJsonc<ProjectConfig>(projectConfigPath);
  const miniprogramRoot = projectConfig?.miniprogramRoot;
  if (miniprogramRoot === undefined) return undefined;

  return path.resolve(path.dirname(projectConfigPath), miniprogramRoot);
}

/**
 * 将 TS 模块导入解析为存在的 TS 文件路径。
 * 支持相对路径与 tsconfig paths 别名；`.js` 后缀、`/index.ts` 均可命中。
 */
export function resolveImportedTsPath(importingFsPath: string, source: string): string | undefined {
  let absolutePath: string | undefined;
  if (source.startsWith(".")) {
    absolutePath = path.resolve(path.dirname(importingFsPath), source);
  } else {
    const tsConfigPath = findNearestFile(path.dirname(importingFsPath), "tsconfig.json");
    if (tsConfigPath === undefined) return undefined;
    absolutePath = resolveModuleSource(source, tsConfigPath);
  }
  if (absolutePath === undefined) return undefined;

  const candidates = [
    absolutePath.endsWith(".ts") ? absolutePath : `${absolutePath}.ts`,
    absolutePath.endsWith(".js") ? `${absolutePath.slice(0, -3)}.ts` : absolutePath,
    path.join(absolutePath, "index.ts"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}
