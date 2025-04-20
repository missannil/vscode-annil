import type { ImportedSubComponentPaths } from "../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { vscode } from "../publicModule";
import { EXTENSION_NAME } from "../utils/constants";
import { findErrMsgRange } from "./findErrMsgRange";

/**
 * 验证缺失(组件)导入
 * @param usingComponentsKeys
 * @param importComponentInfo
 * @param textlines
 * @returns
 */
export function validateMissingImports(
  usingComponentsKeys: string[],
  importComponentInfo: ImportedSubComponentPaths,
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  Object.keys(importComponentInfo).forEach((expectKey) => {
    if (!usingComponentsKeys.includes(expectKey)) {
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange("usingComponents", textlines),
        DiagnosticErrorType.missingImport,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = EXTENSION_NAME;
      diagnostic.code = expectKey;
      diagnostic.info = {
        expectImport: importComponentInfo,
      };
      diagnosticList.push(diagnostic);
    }
  });

  return diagnosticList;
}
