import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("emptyBlock", () => {
  test("报告没有控制属性的 block，并忽略合法 block", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/block/emptyBlock/emptyBlock.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
    assert.strictEqual(diagnostics.length, 2);

    for (const line of [1, 2]) {
      const diagnostic = diagnostics.find((item) => item.range.start.line === line);
      assert.ok(diagnostic);
      assert.strictEqual(diagnostic.message, "空的block标签");
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, "annil.block.empty");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.start.character, 1);
      assert.strictEqual(diagnostic.range.end.line, line);
      assert.strictEqual(diagnostic.range.end.character, 6);
    }
  });
});
