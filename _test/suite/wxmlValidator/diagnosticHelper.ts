import { assert, vscode } from "#deps";

type DiagnosticDetails = {
  message: string;
  source: string | undefined;
  code: vscode.Diagnostic["code"];
  range: readonly [startLine: number, startCharacter: number, endLine: number, endCharacter: number];
};

/** 断言诊断的消息、来源、编号和完整范围。 */
export function assertDiagnosticDetails(
  diagnostic: vscode.Diagnostic,
  expected: DiagnosticDetails,
): void {
  const [startLine, startCharacter, endLine, endCharacter] = expected.range;
  assert.strictEqual(diagnostic.message, expected.message);
  assert.strictEqual(diagnostic.source, expected.source);
  assert.strictEqual(diagnostic.code, expected.code);
  assert.strictEqual(diagnostic.range.start.line, startLine);
  assert.strictEqual(diagnostic.range.start.character, startCharacter);
  assert.strictEqual(diagnostic.range.end.line, endLine);
  assert.strictEqual(diagnostic.range.end.character, endCharacter);
}

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

/** 应用编辑、可选保存 fixture，并等待由该编辑触发的诊断更新。 */
export async function applyEditAndWaitForDiagnostics(
  uri: vscode.Uri,
  edit: vscode.WorkspaceEdit,
  predicate: (diagnostics: readonly vscode.Diagnostic[]) => boolean,
  saveDocument = false,
): Promise<readonly vscode.Diagnostic[]> {
  const diagnosticsReady = waitForDiagnosticUpdate(uri, predicate);
  assert.strictEqual(await vscode.workspace.applyEdit(edit), true);

  if (saveDocument) {
    const document = await vscode.workspace.openTextDocument(uri);
    assert.strictEqual(await document.save(), true);
  }

  return diagnosticsReady;
}
