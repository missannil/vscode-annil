import type { UsingComponents } from "../componentManager/jsonFileManager";
import type { ImportComponentInfo } from "../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { vscode } from "../exportVscode";
import { EXTENSION_NAME } from "../utils/constants";
import { findErrMsgRange } from "./findErrMsgRange";
import { findKeyline } from "./findKeyline";

// 验证usingComponents中的key的路径是否正确,与tsFileExpectImport中的key进行对比
export function validateInvalidPath(
  usingComponents: UsingComponents,
  importComponentInfo: ImportComponentInfo,
  validImportKeys: string[],
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  // 为错误的路径位置生成一个诊断,修复程序为对应的路径
  for (const key of validImportKeys) {
    const correctPath = importComponentInfo[key];
    const currentPath = usingComponents[key];
    if (correctPath !== currentPath) {
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange(currentPath, textlines, findKeyline(textlines, "usingComponents")),
        DiagnosticErrorType.invalidPath,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = EXTENSION_NAME;
      diagnostic.code = currentPath;
      diagnostic.info = {
        correctPath: correctPath as string,
      };
      diagnosticList.push(diagnostic);
    }
  }

  return diagnosticList;
}
