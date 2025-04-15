import type { ImportComponentInfo } from "../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { vscode } from "../exportVscode";
import { EXTENSION_NAME } from "../utils/constants";
import { findErrMsgRange } from "./findErrMsgRange";
import { findKeyline } from "./findKeyline";

// 生成未知导入的诊断并返回正确导入的keys
export function validateUnknownImports(
  usingComponentsKeys: string[],
  importComponentInfo: ImportComponentInfo,
  textlines: string[],
): {
  diagnosticList: vscode.Diagnostic[];
  validImportKeys: string[];
} {
  const diagnosticList: vscode.Diagnostic[] = [];
  // 保留合法的导入组件key
  const validImportKeys: string[] = [];
  usingComponentsKeys.forEach((key) => {
    if (Object.keys(importComponentInfo).includes(key)) {
      validImportKeys.push(key);
    } else {
      // 处理未知导入
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange(key, textlines, findKeyline(textlines, "usingComponents")),
        DiagnosticErrorType.unknownImport,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = EXTENSION_NAME;
      diagnostic.code = key;
      diagnostic.info = {
        expectImport: importComponentInfo,
      };
      diagnosticList.push(diagnostic);
    }
  });

  return {
    diagnosticList,
    validImportKeys,
  };
}
