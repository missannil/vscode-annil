// 检测缺少的自定义组件
import * as vscode from "vscode";

import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import type { CheckContext } from "./CheckContext";

export function checkMissingComponentTags(checkContext: CheckContext): void {
  const { pendingCustomTags, checkedCustomTags: checkedCustomTags, diagnosticList } = checkContext;
  const missingCustomTags = pendingCustomTags.filter((customTagName) => !checkedCustomTags.includes(customTagName));
  missingCustomTags.forEach((customComponentName) => {
    diagnosticList.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 4),
        `${DiagnosticErrorType.missingComopnent}:${customComponentName}`,
        vscode.DiagnosticSeverity.Error,
      ),
    );
  });
}
