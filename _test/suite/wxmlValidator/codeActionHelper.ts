import { assert, vscode } from "#deps";
import { applyEditAndWaitForDiagnostics } from "./diagnosticHelper.js";

/** 通过 VS Code 已注册的 Provider 请求指定诊断位置的 Quick Fix。 */
export async function getQuickFixes(
  uri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): Promise<readonly vscode.CodeAction[]> {
  const actions = await vscode.commands.executeCommand<readonly vscode.CodeAction[]>(
    "vscode.executeCodeActionProvider",
    uri,
    diagnostic.range,
    vscode.CodeActionKind.QuickFix.value,
  );
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  assert.ok(actions, "未获取到 Code Action 列表");

  return actions;
}

/** 应用一个真实 Code Action 的编辑，并等待由该编辑触发的诊断更新。 */
export async function applyCodeActionAndWaitForDiagnostics(
  uri: vscode.Uri,
  action: vscode.CodeAction,
  predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
): Promise<readonly vscode.Diagnostic[]> {
  assert.ok(action.edit, `Code Action “${action.title}”未提供编辑`);

  return applyEditAndWaitForDiagnostics(uri, action.edit, predicate);
}
