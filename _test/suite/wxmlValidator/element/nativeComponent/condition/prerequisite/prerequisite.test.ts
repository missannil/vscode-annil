import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionPrerequisite", () => {
  test("wx:elif 和 wx:else 必须紧随有效条件链", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/prerequisite/prerequisite.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      [
        "wx:elif 缺少前置 wx:if 或 wx:elif",
        "wx:else 缺少前置 wx:if 或 wx:elif",
      ],
    );

    const expectedAttributes = ["wx:elif", "wx:else"];
    diagnostics.forEach((diagnostic, index) => {
      const lineText = document.lineAt(diagnostic.range.start.line).text;
      const attributeName = expectedAttributes[index];
      const start = lineText.indexOf(attributeName);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.missingPrerequisite");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + attributeName.length);
    });
  });
});
