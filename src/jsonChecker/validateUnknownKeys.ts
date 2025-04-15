import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { vscode } from "../exportVscode";
import type { JsonConfig } from "../goToDefinition/getJsonConfig";
import { findErrMsgRange } from "./findErrMsgRange";

function getLegalConfigKeys(): string[] {
  const defaultKeys = ["usingComponents", "component", "componentPlaceholder", "disableScroll"];
  const userConfigKeys = (vscode.workspace.getConfiguration("annil").get("jsonConfigKeys") ?? []) as string[];

  return [...defaultKeys, ...userConfigKeys];
}

/**
 * 验证未知的配置属性,返回错误的诊断
 * ```json components 属性是错误的 多了一个s 应该是 component
 * {
 *  "components": true,
 *   ...
 * }
 * @param legalConfigKeys
 * @param config
 * @param textlines
 * @returns
 */
export function validateUnknownProperty(
  config: JsonConfig,
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const legalConfigKeys = getLegalConfigKeys();
  Object.keys(config).forEach((key) => {
    if (!legalConfigKeys.includes(key)) {
      diagnosticList.push(
        new vscode.Diagnostic(
          findErrMsgRange(key, textlines),
          DiagnosticErrorType.unknownProperty,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }
  });

  return diagnosticList;
}
