import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForMissingValue", () => {
  test("覆盖 wx:for-item、wx:for-index 和 wx:key 无值分支", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/missingValue/missingValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(
      wxmlUri,
      (current) => current.filter((item) => item.code === "annil.wxFor.missingValue").length === 3,
    );
    const missingValues = diagnostics.filter((item) => item.code === "annil.wxFor.missingValue");
    assert.strictEqual(missingValues.length, 3);

    for (const attributeName of ["wx:for-item", "wx:for-index", "wx:key"] as const) {
      const diagnostic = missingValues.find((item) => item.message === `${attributeName} 不可无值`);
      assert.ok(diagnostic);
      const line = diagnostic.range.start.line;
      const start = document.lineAt(line).text.indexOf(attributeName);
      assert.strictEqual(diagnostic.message, `${attributeName} 不可无值`);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + attributeName.length);
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    }
  });
});
