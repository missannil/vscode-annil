import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionMustacheSyntax", () => {
  test("wx:if 和 wx:elif 的值必须使用 mustache", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/mustacheSyntax/mustacheSyntax.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["不符合'{{}}'语法", "不符合'{{}}'语法"],
    );

    const expectedAttributes = ["wx:if", "wx:elif"];
    diagnostics.forEach((diagnostic, index) => {
      const attribute = expectedAttributes[index];
      const start = document.lineAt(diagnostic.range.start.line).text.indexOf(attribute);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.mustacheSyntax");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + attribute.length);
    });
  });
});
