import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("invalidVariable", () => {
  test("非法变量名产生诊断，合法变量名不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/invalidVariable/invalidVariable.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);

    // 仅关注变量语法相关诊断
    const invalidDiags = diagnostics.filter((d) => d.message.startsWith("无效的变量:"));
    assert.strictEqual(invalidDiags.length, 2);

    // 按行号排序
    invalidDiags.sort((a, b) => a.range.start.line - b.range.start.line);

    // ① 123invalid：以数字开头
    assert.strictEqual(invalidDiags[0].message, `无效的变量: "123invalid"`);
    assert.strictEqual(invalidDiags[0].severity, vscode.DiagnosticSeverity.Error);

    // ② a-b：包含非法连接符（非 JS 标识符）
    assert.strictEqual(invalidDiags[1].message, `无效的变量: "a-b"`);
    assert.strictEqual(invalidDiags[1].severity, vscode.DiagnosticSeverity.Error);
  });
});
