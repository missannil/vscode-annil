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

    // 期望 2 条未知数据诊断（myItem 在 scope 外被引用两次）
    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);

    const unknownDiags = diagnostics.filter((d) => d.message.startsWith("未知数据:"));
    assert.strictEqual(unknownDiags.length, 2);

    // 验证两条都是 "myItem"
    assert.strictEqual(unknownDiags[0].message, `未知数据: "myItem"`);
    assert.strictEqual(unknownDiags[1].message, `未知数据: "myItem"`);
    // 应都是 Error 级别
    unknownDiags.forEach((d) => {
      assert.strictEqual(d.severity, vscode.DiagnosticSeverity.Error);
    });

    // 验证作用域内的 myItem、idx、outerData 没有产生未知数据诊断
    const allUnknownMessages = unknownDiags.map((d) => d.message);
    assert.ok(!allUnknownMessages.some((m) => m.includes("idx")), "idx 应在作用域内有效");
    assert.ok(!allUnknownMessages.some((m) => m.includes("outerData")), "outerData 应在作用域内有效");
  });
});
