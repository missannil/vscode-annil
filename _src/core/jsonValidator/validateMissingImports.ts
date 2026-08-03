import { vscode } from "#deps";
import { JsonDiagnosticCode } from "./diagnosticCodes.js";
import { setJsonDiagnosticInfo } from "./diagnosticInfo.js";
import { findErrMsgRange } from "./findErrMsgRange.js";

/**
 * 验证缺失的组件导入
 *
 * TS 中引用了子组件但 JSON 的 usingComponents 中未声明
 */
export function validateMissingImports(
  usingComponentsKeys: string[],
  importedSubCompInfo: Record<string, string | undefined>,
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];

  for (const expectKey of Object.keys(importedSubCompInfo)) {
    if (!usingComponentsKeys.includes(expectKey)) {
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange("usingComponents", textlines),
        " 缺少导入的组件",
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "vscode-annil";
      diagnostic.code = JsonDiagnosticCode.missingImport;
      setJsonDiagnosticInfo(diagnostic, {
        componentName: expectKey,
        expectImport: importedSubCompInfo,
      });
      diagnosticList.push(diagnostic);
    }
  }

  return diagnosticList;
}
