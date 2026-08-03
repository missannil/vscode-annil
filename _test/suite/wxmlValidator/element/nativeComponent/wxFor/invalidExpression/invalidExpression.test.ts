import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForInvalidExpression", () => {
  test("报告 wx:for 非法表达式并忽略合法成员表达式", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/invalidExpression/invalidExpression.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
    const [diagnostic] = diagnostics;
    const line = Array.from({ length: document.lineCount }, (_, index) => index).find((index) =>
      document.lineAt(index).text.includes("wx:for=\"{{")
    );
    assert.notStrictEqual(line, undefined);
    const lineText = document.lineAt(line as number).text;
    const start = lineText.indexOf("wx:for");

    assert.strictEqual(diagnostic.message, "wx:for 值必须是有效表达式");
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.code, "annil.wxFor.invalidExpression");
    assert.strictEqual(diagnostic.range.start.line, line);
    assert.strictEqual(diagnostic.range.start.character, start);
    assert.strictEqual(diagnostic.range.end.character, start + "wx:for".length);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
  });
});
