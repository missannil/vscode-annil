import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("wxForScope", () => {
  test("wx:for 作用域内自定义变量有效，作用域外产生未知数据诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxForScope/wxForScope.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    // 期望 4 条未知数据诊断（myItem 在作用域外被直接、点访问和下标访问）
    const diagnostics = await waitForStableDiagnostics(wxmlUri, 4);
    assert.strictEqual(diagnostics.length, 4);

    const unknownDiags = diagnostics.filter((d) => d.message.startsWith("未知数据:"));
    assert.strictEqual(unknownDiags.length, 4);

    // 验证所有作用域外表达式的顶层变量都是 "myItem"
    unknownDiags.forEach((diagnostic) => {
      assert.strictEqual(diagnostic.message, `未知数据: "myItem"`);
    });
    // 应都是 Error 级别
    unknownDiags.forEach((d) => {
      assert.strictEqual(d.severity, vscode.DiagnosticSeverity.Error);
    });

    const lines = document.getText().split("\n");
    const myItemUseLines = lines
      .map((line, index) => line.includes("{{myItem") ? index : -1)
      .filter((index) => index >= 0);
    const scopeEndMarkerLine = lines.findIndex((line) => line.includes("④ myItem"));
    const outsideMyItemUseLines = myItemUseLines.filter((line) => line > scopeEndMarkerLine);
    assert.strictEqual(outsideMyItemUseLines.length, 3);
    assert.strictEqual(myItemUseLines.length, 7);
    assert.deepStrictEqual(
      unknownDiags.map((diagnostic) => diagnostic.range.start.line).sort((a, b) => a - b),
      [myItemUseLines[0], ...outsideMyItemUseLines].sort((a, b) => a - b),
    );
    unknownDiags.forEach((diagnostic) => {
      const lineText = document.lineAt(diagnostic.range.start.line).text;
      const start = lineText.indexOf("myItem");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + "myItem".length);
    });

    // 验证作用域内的 myItem、idx、outerData 没有产生未知数据诊断
    const allUnknownMessages = unknownDiags.map((d) => d.message);
    assert.ok(!allUnknownMessages.some((m) => m.includes("idx")), "idx 应在作用域内有效");
    assert.ok(!allUnknownMessages.some((m) => m.includes("outerData")), "outerData 应在作用域内有效");
  });
});
