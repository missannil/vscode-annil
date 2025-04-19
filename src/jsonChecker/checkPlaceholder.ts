import type { ComponentPlaceholder } from "../componentManager/jsonFileManager";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { vscode } from "../publicModule";
import { EXTENSION_NAME } from "../utils/constants";
import { findErrMsgRange } from "./findErrMsgRange";
import { findKeyline } from "./findKeyline";

export function checkPlaceholder(
  componentPlaceholder: ComponentPlaceholder,
  usingComponentKeys: string[],
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  // unknownComponentPlaceholder
  for (const key in componentPlaceholder) {
    // 如果jsonFileComponentPlaceholder中有定义合法的key,则跳过
    if (usingComponentKeys.includes(key)) {
      // 去除key
      usingComponentKeys.splice(usingComponentKeys.indexOf(key), 1);
      continue;
    }
    const startLine = findKeyline(textlines, "componentPlaceholder");

    const diagnostic = new vscode.Diagnostic(
      findErrMsgRange(key, textlines, startLine - 1),
      DiagnosticErrorType.unknownPlaceholder,
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = EXTENSION_NAME;
    diagnostic.code = key;
    diagnosticList.push(diagnostic);
  }
  // missingPlaceholder  如果jsonFileComponentPlaceholder还存在合法的key,则是缺少了合法的key
  usingComponentKeys.forEach((key) => {
    const diagnostic = new vscode.Diagnostic(
      findErrMsgRange("componentPlaceholder", textlines),
      DiagnosticErrorType.missingPlaceholder,
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = EXTENSION_NAME;
    diagnostic.code = key;
    diagnosticList.push(diagnostic);
  });

  return diagnosticList;
}
