import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix, withRestoredFixture } from "../../codeActionHelper.js";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../../../../../");
const diagnosticCode = "annil.condition.illegalElementIf";
const diagnosticMessage = "不允许 wx:if 属性写在元素中，要写在单独的包裹元素(block)中";
const actionTitle = "将 wx:if 移到 block 包裹元素";

function fixtureUri(): vscode.Uri {
  return Uri.file(path.join(projectRoot, "_test/suite/wxmlValidator/element/illegalIf/illegalIf.wxml"));
}

async function illegalDiagnostics(uri: vscode.Uri): Promise<readonly vscode.Diagnostic[]> {
  const diagnostics = await waitForDiagnostics(uri, (current) => current.length > 0);

  const result = diagnostics.filter((item) => item.code === diagnosticCode);

  assert.strictEqual(result.length, 3);

  return result;
}

describe("illegalElementIf", () => {
  test("检查 CustomComponent、ChunkComponent 和原生元素", async () => {
    const uri = fixtureUri();
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await illegalDiagnostics(uri);

    for (const diagnostic of diagnostics) {
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, diagnosticCode);
      assert.strictEqual(diagnostic.message, diagnosticMessage);
      const line = document.lineAt(diagnostic.range.start.line).text;
      const start = line.indexOf("wx:if");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + 5);
    }
  });

  for (
    const [condition, expected, tag] of [
      ["{{subInline_isReady}}", "<block wx:if=\"{{subInline_isReady}}\">", "<subInline"],
      ["{{chunkInline_visible}}", "<block wx:if=\"{{chunkInline_visible}}\">", "<view id=\"chunkInline\""],
      ["{{missingVisible}}", "<block wx:if=\"{{missingVisible}}\">", "<view"],
    ] as const
  ) {
    test(`Quick Fix 保留 ${condition} 原条件值`, async () => {
      const uri = fixtureUri();
      const document = await workspace.openTextDocument(uri);
      await window.showTextDocument(document);
      await withRestoredFixture(
        uri,
        (current) => current.filter((item) => item.code === diagnosticCode).length === 3,
        async () => {
          const diagnostics = await illegalDiagnostics(uri);
          const current = await workspace.openTextDocument(uri);
          const diagnostic = diagnostics.find((item) => current.lineAt(item.range.start.line).text.includes(condition));
          assert.ok(diagnostic);
          if (diagnostic === undefined) return;

          const action = await waitForQuickFix(uri, diagnostic, actionTitle);
          await applyCodeActionAndWaitForDiagnostics(
            uri,
            action,
            (currentDiagnostics) => currentDiagnostics.filter((item) => item.code === diagnosticCode).length === 2,
          );
          const text = (await workspace.openTextDocument(uri)).getText();
          assert.strictEqual(text.includes(expected), true);
          assert.strictEqual(text.includes(`${tag} wx:if="${condition}"`), false);
          if (condition === "{{missingVisible}}") {
            const diagnosticsAfterFix = await waitForDiagnostics(
              uri,
              (current) => current.some((item) => item.code === "annil.condition.unknownValue"),
            );
            assert.strictEqual(
              diagnosticsAfterFix.some((item) => item.code === "annil.condition.unknownValue"),
              true,
            );
          }
        },
      );
    });
  }
});
