import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForVariables", () => {
  test("校验 item/index 变量语法、冲突和无值属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/variables/variables.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 4);
    assert.strictEqual(diagnostics.length, 4);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      [
        "变量名冲突: \"outer\"",
        "变量名冲突: \"outerIndex\"",
        "无效的变量: \"1bad\"",
        "wx:for 不可无值",
      ],
    );
    const expectedRanges = ["outer", "outerIndex", "1bad", "wx:for"];
    const expectedCodes = [
      "annil.wxFor.variableConflict",
      "annil.wxFor.variableConflict",
      "annil.wxFor.invalidVariable",
      "annil.wxFor.missingValue",
    ];
    diagnostics.forEach((diagnostic, index) => {
      const lineText = document.lineAt(diagnostic.range.start.line).text;
      const expectedText = expectedRanges[index];
      const start = lineText.indexOf(expectedText);
      assert.ok(start >= 0, `未在诊断行找到 ${expectedText}`);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, expectedCodes[index]);
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + expectedText.length);
    });

    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.range.start.line === 0),
      "最外层合法 item/index 不应产生诊断",
    );
  });
});
