import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("notRootData", () => {
  test("未定义数据产生诊断，已定义数据不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/notRootData/notRootData.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);

    // 同一行的两个相同表达式必须分别定位，不能都回退到第一个匹配位置。
    const unknownDiags = diagnostics.filter((d) => d.message.startsWith("未知数据:"));
    assert.strictEqual(unknownDiags.length, 2);

    const line = document.getText().split("\n").findIndex((text) => text.includes("{{undefData}}{{undefData}}"));
    assert.ok(line >= 0);
    const lineText = document.lineAt(line).text;
    const firstStart = lineText.indexOf("undefData");
    const secondStart = lineText.indexOf("undefData", firstStart + 1);
    assert.ok(secondStart > firstStart);

    unknownDiags.sort((left, right) => left.range.start.character - right.range.start.character);
    for (const diagnostic of unknownDiags) {
      assert.strictEqual(diagnostic.message, `未知数据: "undefData"`);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, "annil.expression.unknownData");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.end.line, line);
      assert.strictEqual(diagnostic.range.end.character - diagnostic.range.start.character, "undefData".length);
    }
    assert.strictEqual(unknownDiags[0].range.start.character, firstStart);
    assert.strictEqual(unknownDiags[1].range.start.character, secondStart);
  });
});
