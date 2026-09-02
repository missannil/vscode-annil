import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe as suite, it as test } from "mocha";
import { waitForQuickFix, withRestoredFixture } from "../../wxmlValidator/codeActionHelper.js";
import { waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const componentUri = vscode.Uri.file(path.join(projectRoot, "_test/suite/tsAnalyzer/unusedData/unusedData.ts"));
const expectedNames = ["rootUnused", "_custom_Unused", "chunk_Unused"] as const;

suite("unusedData", () => {
  test("三个组件 API 的未使用数据均可通过 Quick Fix 忽略并恢复", async function() {
    this.timeout(10_000);
    const document = await vscode.workspace.openTextDocument(componentUri);
    await vscode.window.showTextDocument(document);

    await withRestoredFixture(
      componentUri,
      (diagnostics) =>
        expectedNames.every((name) => diagnostics.some((diagnostic) => getDiagnosticName(diagnostic) === name)),
      async () => {
        let diagnostics = await waitForDiagnostics(
          componentUri,
          (current) => current.length === expectedNames.length,
          10_000,
        );
        assert.deepStrictEqual(diagnostics.map(getDiagnosticName), [...expectedNames]);

        for (const [index, name] of expectedNames.entries()) {
          const diagnostic = diagnostics.find((item) => getDiagnosticName(item) === name);
          assert.ok(diagnostic, `应找到 ${name} 的未使用诊断`);
          const action = await waitForQuickFix(componentUri, diagnostic, "忽略此未使用诊断");
          assert.ok(action.edit, "忽略 Quick Fix 应提供编辑");
          assert.strictEqual(await vscode.workspace.applyEdit(action.edit), true);
          diagnostics = await waitForDiagnostics(
            componentUri,
            (current) => current.length === expectedNames.length - index - 1,
            10_000,
          );
        }

        assert.strictEqual(document.getText().match(/annil disable (unusedData|suggestInternalData)/g)?.length, 3);
      },
    );
  });

  test("文件头部注释可以忽略整个 TS 文件的未使用诊断", async function() {
    this.timeout(10_000);
    const document = await vscode.workspace.openTextDocument(componentUri);
    await vscode.window.showTextDocument(document);

    await withRestoredFixture(
      componentUri,
      (diagnostics) => diagnostics.length === expectedNames.length,
      async () => {
        const edit = new vscode.WorkspaceEdit();
        edit.insert(componentUri, new vscode.Position(0, 0), "// annil disable unusedData\n");
        assert.strictEqual(await vscode.workspace.applyEdit(edit), true);
        const diagnostics = await waitForDiagnostics(componentUri, (current) => current.length === 0, 10_000);
        assert.strictEqual(diagnostics.length, 0);
      },
    );
  });
});

function getDiagnosticName(diagnostic: unknown): string | undefined {
  const info = (diagnostic as { info?: unknown }).info as { name?: string } | undefined;

  return info?.name;
}
