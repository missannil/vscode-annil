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

/**
 * 等待已注册 Provider 返回指定标题的真实 Quick Fix。
 *
 * 诊断发布与 VS Code Code Action 请求在不同异步通道中完成；刚启动的
 * Extension Host 偶尔会取消首次请求，或先返回空列表。对此短暂重试，
 * 但始终通过 `vscode.executeCodeActionProvider` 验证实际 Provider 分发。
 */
export async function waitForQuickFix(
  uri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
  title: string,
  timeoutMs = 2_000,
): Promise<vscode.CodeAction> {
  const intervalMs = 25;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const action = (await getQuickFixes(uri, diagnostic)).find((item) => item.title === title);
      if (action !== undefined) return action;
    } catch {
      // Extension Host 启动期间首次请求可能被 VS Code 取消，下一轮重试。
    }
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  assert.fail(`等待 Quick Fix 超时：${title}`);
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
