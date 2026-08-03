import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForValue", () => {
  test("校验 wx:for 和 wx:key 的值", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/value/value.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 4);
    assert.strictEqual(diagnostics.length, 4);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      [
        "wx:for 数据必须是数组类型: \"notArray\"",
        "未知数据: \"missing\"",
        "wx:for 值必须使用 mustache",
        "无效的变量: \"123\"",
      ],
    );
    const expectedRanges = ["notArray", "missing", "wx:for", "123"];
    const expectedCodes = [
      "annil.wxFor.nonArrayData",
      "annil.wxFor.unknownData",
      "annil.wxFor.mustacheSyntax",
      "annil.wxFor.invalidVariable",
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

    const diagnosticLines = new Set(diagnostics.map((diagnostic) => diagnostic.range.start.line));
    assert.ok(!diagnosticLines.has(0), "合法数组数据不应产生诊断");
    assert.ok(!diagnosticLines.has(1), "合法 wx:key 不应产生诊断");
    assert.ok(!diagnosticLines.has(2), "合法成员访问不应产生诊断");
  });
});
