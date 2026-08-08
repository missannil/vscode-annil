import { path, vscode } from "#deps";
import { getMiniprogramRoot } from "../tsAnalyzer/tsConfigResolver.js";
import type { UsingComponents } from "../types/JsonFileInfo.js";
import { JsonDiagnosticCode } from "./diagnosticCodes.js";
import { setJsonDiagnosticInfo } from "./diagnosticInfo.js";
import { findErrMsgRange } from "./findErrMsgRange.js";
import { findKeyline } from "./findKeyline.js";

/**
 * 验证 usingComponents 中 key 对应的路径是否正确
 *
 * 与 TS 中推导的 importComponentInfo 进行对比
 */
export function validateInvalidPath(
  usingComponents: UsingComponents,
  importedSubCompInfo: Record<string, string | undefined>,
  validImportKeys: string[],
  textlines: string[],
  jsonFsPath: string,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];

  for (const key of validImportKeys) {
    const correctPath = importedSubCompInfo[key];
    const currentPath = usingComponents[key];
    if (correctPath !== normalizeUsingComponentPath(jsonFsPath, currentPath)) {
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange(currentPath, textlines, findKeyline(textlines, "usingComponents")),
        "无效的路径",
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "vscode-annil";
      diagnostic.code = JsonDiagnosticCode.invalidPath;
      if (typeof correctPath === "string") setJsonDiagnosticInfo(diagnostic, { correctPath });
      diagnosticList.push(diagnostic);
    }
  }

  return diagnosticList;
}

/**
 * 将 JSON usingComponents 中的路径归一化为根相对路径（以 / 开头）。
 * 以 / 开头的路径保持不变；相对路径以 JSON 文件所在目录为基准解析后，
 * 无法映射到小程序根目录的路径原样返回（按字符串比较）。
 */
function normalizeUsingComponentPath(jsonFsPath: string, currentPath: string): string {
  if (currentPath.startsWith("/")) return currentPath;

  const miniprogramRoot = getMiniprogramRoot(jsonFsPath);
  if (miniprogramRoot === undefined) return currentPath;

  const absolute = path.resolve(path.dirname(jsonFsPath), currentPath);
  const relative = path.relative(miniprogramRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return currentPath;

  return `/${relative.split(path.sep).join("/")}`;
}
