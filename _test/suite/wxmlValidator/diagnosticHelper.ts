import { vscode } from "#deps";

/**
 * 等待指定文档的诊断满足断言条件。
 *
 * VS Code 在扩展宿主中异步发布诊断，测试不能依赖固定延时；当诊断已就绪时，
 * 该方法会立即返回，否则会在超时前短暂轮询。
 */
export async function waitForDiagnostics(
  uri: vscode.Uri,
  predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
  timeoutMs = 2_000,
): Promise<readonly vscode.Diagnostic[]> {
  const intervalMs = 25;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    if (predicate(diagnostics)) return diagnostics;
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  const diagnostics = vscode.languages.getDiagnostics(uri);
  throw new Error(`等待诊断超时，当前诊断数：${diagnostics.length}`);
}

/**
 * 等待目标文档完成一次诊断发布。
 *
 * 用于“无诊断”的正向用例：直接读取空列表会在插件尚未完成扫描时错误通过，
 * 因此必须先等待该文档出现在诊断变更事件中。
 */
export function waitForDiagnosticUpdate(
  uri: vscode.Uri,
  predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
  timeoutMs = 2_000,
): Promise<readonly vscode.Diagnostic[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.dispose();
      const diagnostics = vscode.languages.getDiagnostics(uri);
      reject(new Error(`等待诊断发布超时，当前诊断数：${diagnostics.length}`));
    }, timeoutMs);
    const subscription = vscode.languages.onDidChangeDiagnostics((event) => {
      if (!event.uris.some((changedUri) => changedUri.toString() === uri.toString())) return;

      const diagnostics = vscode.languages.getDiagnostics(uri);
      if (!predicate(diagnostics)) return;

      clearTimeout(timeout);
      subscription.dispose();
      resolve(diagnostics);
    });
  });
}
