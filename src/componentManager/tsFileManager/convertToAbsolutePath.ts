import path from "path";
import { assertNonNullable } from "../../utils/assertNonNullable";

// 判断是否为相对路径
function isRelativePath(importPath: string): boolean {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

/**
 * 解析相对路径
 */
function resolveRelativePath(fsPath: string, importPath: string): string {
  const currentDir = path.dirname(fsPath);
  const targetPath = path.resolve(currentDir, importPath);
  // 检查是否已有文件扩展名
  const hasExtension = path.extname(targetPath) !== "";

  // 如果没有扩展名，添加 .ts；如果已经有扩展名，保持原样
  return hasExtension ? targetPath : targetPath + ".ts";
}

// 判断是否无/开头的路径 vscode在自动导入推荐路径时(配置了baseUrl时),会出现没有/开头的路径情况。
function isNoSlashPath(importPath: string): boolean {
  return !importPath.startsWith("/") && !isRelativePath(importPath);
}

// 判断是否是别名路径
function isAliasPath(aliasPartWithStar: string, aliasConfig: Record<string, string[]>): boolean {
  return Object.keys(aliasConfig).some((itemAlias) => aliasPartWithStar === itemAlias);
}

/**
 * 把一个相对路径转换为绝对路径
 * 当遇到变量前缀时只考虑与aliasConfig的第一个匹配项([0]项)匹配。
 */
export function convertToAbsolutePath(
  // tsconfig.json路径
  tsconfigPath: string,
  // 当前文件路径
  currentPath: string,
  // 当前文件导入的路径 可能是 ./、../开头的相对路,也可能是 无/开头的路径(相对于baseUrl的情况),也可能是有变量的路径(例如@Component,会用到aliasConfig)
  importPath: string,
  // 基础路径,在相对路径没有前缀时用得到(即tsconfig.json的baseUrl)
  baseUrl: string | undefined,
  // 变量路径的配置 (例如 tsconfig.json的paths配置)
  aliasConfig: Record<string, string[]> | undefined,
): string {
  if (isRelativePath(importPath)) {
    return resolveRelativePath(currentPath, importPath);
  }
  if (aliasConfig === undefined) {
    return importPath;
  }
  // 导入路径的第一个部分(即变量前缀)
  const aliasPart = importPath.split("/")[0];
  const aliasPartWithStar = aliasPart + "/*";
  if (isAliasPath(aliasPartWithStar, aliasConfig)) {
    // 处理别名路径
    const firstAliasPathWithoutStar = aliasConfig[aliasPartWithStar][0].slice(0, -2);
    const relativePath = importPath.replace(aliasPart, firstAliasPathWithoutStar);
    const targetPath = path.resolve(path.dirname(tsconfigPath), assertNonNullable(baseUrl), relativePath);
    // 检查是否已有文件扩展名
    const hasExtension = path.extname(targetPath) !== "";
    // 如果没有扩展名，添加 .ts；如果已经有扩展名，保持原样
    const finalPath = hasExtension ? targetPath : targetPath + ".ts";

    return finalPath;
  }
  // 处理无/开头的路径
  if (isNoSlashPath(importPath)) {
    // 在没有/开头的路径时,baseUrl是一定存在的,只有在baseUrl存在的情况下,vscode的自动提示才会出现没有/开头的路径。
    const targetPath = path.resolve(path.dirname(tsconfigPath), assertNonNullable(baseUrl), importPath);
    // 检查是否已有文件扩展名
    const hasExtension = path.extname(targetPath) !== "";
    // 如果没有扩展名，添加 .ts；如果已经有扩展名，保持原样
    const finalPath = hasExtension ? targetPath : targetPath + ".ts";

    return finalPath;
  }

  return importPath;
}
