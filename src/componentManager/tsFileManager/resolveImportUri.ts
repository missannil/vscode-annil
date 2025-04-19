/* eslint-disable complexity */
import * as path from "path";
import type { TsAliasPaths, TsConfigInfo } from "../../miniprogramConfig";

// 判断是否为相对路径
function isRelativePath(importPath: string): boolean {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

// 判断是否无/开头的路径 vscode在自动导入推荐路径时(配置了baseUrl时),会出现没有/开头的路径情况。
function isNoSlashPath(importPath: string): boolean {
  return !importPath.startsWith("/") && !isRelativePath(importPath);
}

function isAliasPath(firstPath: string, tsAliasPaths: TsAliasPaths): boolean {
  return Object.keys(tsAliasPaths).some((alias) => alias === firstPath + "/*");
}

/**
 * 解析导入路径为完整的 URI
 * @param currentPath 当前文件的 URI
 * @param importPath 导入语句中的路径（如 "./xxx", "components/xxx", "@alias/xxx"）
 * @returns 导入文件的 URI
 */
export function resolveImportPath(currentPath: string, tsConfigInfo: TsConfigInfo, importPath: string): string {
  if (isRelativePath(importPath)) {
    return path.resolve(path.dirname(currentPath), importPath) + ".ts";
  }
  const baseUrl = tsConfigInfo.config.compilerOptions?.baseUrl;
  if (tsConfigInfo === null || baseUrl === undefined) {
    throw new Error(`未找到 tsconfig.json 或 baseUrl 配置`);
  }
  const tsConfigPaths = tsConfigInfo.config.compilerOptions?.paths;
  const firstPath = importPath.split("/")[0];
  // 处理别名路径 即命中了paths的路径
  if (tsConfigPaths && isAliasPath(firstPath, tsConfigPaths)) {
    const tsConfigDir = path.dirname(tsConfigInfo.fsPath);
    const alias = firstPath + "/*";
    const aliasPaths = tsConfigPaths[alias];
    if (aliasPaths) {
      // 替换路径中的别名部分
      const replacePath = aliasPaths[0].replace("/*", "");
      const relativePath = importPath.replace(firstPath, replacePath);
      const targetPath = path.resolve(tsConfigDir, baseUrl, relativePath);
      // 检查是否已有文件扩展名
      const hasExtension = path.extname(targetPath) !== "";

      // 如果没有扩展名，添加 .ts；如果已经有扩展名，保持原样
      return hasExtension ? targetPath : targetPath + ".ts";
    }
  }
  // 处理无/开头的路径 即命中了baseUrl的路径
  if (isNoSlashPath(importPath)) {
    const tsConfigDir = path.dirname(tsConfigInfo.fsPath);
    const targetPath = path.resolve(tsConfigDir, baseUrl, importPath);
    const hasExtension = path.extname(targetPath) !== "";

    // 如果没有扩展名，添加 .ts；如果已经有扩展名，保持原样
    return hasExtension ? targetPath : targetPath + ".ts";
  }

  throw new Error(`不支持的导入路径格式: ${importPath}`);
}
