import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("illegalOperator", () => {
  test("产生两条非法运算符诊断，不误报合法表达式", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/illegalOperator/illegalOperator.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);

    // 仅关注非法运算符相关诊断
    const operatorDiags = diagnostics.filter((d) => d.message.startsWith("非法的运算符:"));
    assert.strictEqual(operatorDiags.length, 2);

    // 按行号排序
    operatorDiags.sort((a, b) => a.range.start.line - b.range.start.line);

    assert.strictEqual(operatorDiags[0].message, `非法的运算符: "&"`);
    assert.strictEqual(operatorDiags[0].source, "vscode-annil");
    assert.strictEqual(operatorDiags[0].code, "annil.expression.illegalOperator");
    assert.strictEqual(operatorDiags[0].severity, vscode.DiagnosticSeverity.Error);
    // 确保诊断范围覆盖 mustache 区域
    assert.ok(operatorDiags[0].range.start.character >= 10);

    assert.strictEqual(operatorDiags[1].message, `非法的运算符: "="`);
    assert.strictEqual(operatorDiags[1].source, "vscode-annil");
    assert.strictEqual(operatorDiags[1].code, "annil.expression.illegalOperator");
    assert.strictEqual(operatorDiags[1].severity, vscode.DiagnosticSeverity.Error);
    assert.ok(operatorDiags[1].range.start.character >= 10);
  });
});
