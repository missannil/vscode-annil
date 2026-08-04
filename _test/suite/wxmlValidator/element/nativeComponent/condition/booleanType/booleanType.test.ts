import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionBooleanType", () => {
  test("wx:if 和 wx:elif 的简单条件必须是布尔类型", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/booleanType/booleanType.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["条件数据必须是布尔类型: \"count\"", "条件数据必须是布尔类型: \"count\""],
    );

    const expectedValues = ["count", "count"];
    diagnostics.forEach((diagnostic, index) => {
      const value = expectedValues[index];
      const start = document.lineAt(diagnostic.range.start.line).text.indexOf(value);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.nonBooleanValue");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + value.length);
    });
  });
});
