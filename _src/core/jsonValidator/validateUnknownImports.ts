import { vscode } from "#deps";
import { JsonDiagnosticCode } from "./diagnosticCodes.js";
import { setJsonDiagnosticInfo } from "./diagnosticInfo.js";
import { findErrMsgRange } from "./findErrMsgRange.js";
import { findKeyline } from "./findKeyline.js";

/**
 * 验证未知的组件导入，返回诊断列表和合法的导入 key 列表
 *
 * JSON usingComponents 中声明了但 TS 中未引用的子组件
 */
export function validateUnknownImports(
  usingComponentsKeys: string[],
  importedSubCompInfo: Record<string, string | undefined>,
  textlines: string[],
): {
  diagnosticList: vscode.Diagnostic[];
  validImportKeys: string[];
} {
  const diagnosticList: vscode.Diagnostic[] = [];
  const validImportKeys: string[] = [];

  for (const key of usingComponentsKeys) {
    if (Object.keys(importedSubCompInfo).includes(key)) {
      validImportKeys.push(key);
    } else {
      // 未知导入
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange(key, textlines, findKeyline(textlines, "usingComponents")),
        "未知的导入",
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "vscode-annil";
      diagnostic.code = JsonDiagnosticCode.unknownImport;
      setJsonDiagnosticInfo(diagnostic, {
        componentName: key,
        expectImport: importedSubCompInfo,
      });
      diagnosticList.push(diagnostic);
    }
  }

  return { diagnosticList, validImportKeys };
}
