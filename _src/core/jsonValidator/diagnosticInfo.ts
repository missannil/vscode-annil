import { type vscode } from "#deps";

export type JsonDiagnosticInfo = {
  componentName?: string;
  configKey?: string;
  expectImport?: Record<string, string | undefined>;
  correctPath?: string;
};

type JsonDiagnostic = vscode.Diagnostic & { info?: JsonDiagnosticInfo };

/** 读取 Annil JSON 诊断携带的规则参数。 */
export function getJsonDiagnosticInfo(diagnostic: vscode.Diagnostic): JsonDiagnosticInfo {
  return (diagnostic as JsonDiagnostic).info ?? {};
}

/** 为 Annil JSON 诊断附加供 Quick Fix 使用的规则参数。 */
export function setJsonDiagnosticInfo(diagnostic: vscode.Diagnostic, info: JsonDiagnosticInfo): void {
  (diagnostic as JsonDiagnostic).info = info;
}
