import { vscode } from "#deps";
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
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];

  for (const key of validImportKeys) {
    const correctPath = importedSubCompInfo[key];
    const currentPath = usingComponents[key];
    if (correctPath !== currentPath) {
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
