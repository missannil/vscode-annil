import { vscode } from "#deps";
import { findErrMsgRange } from "./findErrMsgRange.js";

/** 合法 JSON 配置键白名单 */
const DEFAULT_LEGAL_KEYS = ["usingComponents", "component", "componentPlaceholder", "disableScroll"];

function getLegalConfigKeys(): string[] {
  const userConfigKeys = (vscode.workspace.getConfiguration("annil").get("jsonConfigKeys") ?? []) as string[];

  return [...DEFAULT_LEGAL_KEYS, ...userConfigKeys];
}

/**
 * 验证未知的配置属性
 *
 * 例如 `"components": true` 应该是 `"component": true`
 */
export function validateUnknownKeys(
  config: Record<string, unknown>,
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const legalConfigKeys = getLegalConfigKeys();

  for (const key of Object.keys(config)) {
    if (!legalConfigKeys.includes(key)) {
      const diagnostic = new vscode.Diagnostic(
        findErrMsgRange(key, textlines),
        "未知配置属性",
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = "vscode-annil";
      diagnostic.code = key;
      diagnosticList.push(diagnostic);
    }
  }

  return diagnosticList;
}
