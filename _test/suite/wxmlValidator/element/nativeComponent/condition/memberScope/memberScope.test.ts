import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionMemberScope", () => {
  test("成员和下标条件只校验根变量作用域", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/memberScope/memberScope.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["未知数据: \"missing\"", "未知数据: \"missing\""],
    );

    const expectedExpressions = ["missing.enabled", "missing[0].enabled"];
    diagnostics.forEach((diagnostic, index) => {
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.unknownValue");
      assert.strictEqual(document.getText(diagnostic.range), expectedExpressions[index]);
    });
  });
});
