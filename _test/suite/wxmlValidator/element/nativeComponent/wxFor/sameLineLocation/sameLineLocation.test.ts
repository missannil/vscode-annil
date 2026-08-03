import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForSameLineLocation", () => {
  test("定位同一行多个 block 的结构和值诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/sameLineLocation/sameLineLocation.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 4);
    const firstLineText = document.lineAt(0).text;
    const secondLineText = document.lineAt(1).text;
    const firstBlockStart = firstLineText.indexOf("block");
    const secondBlockStart = secondLineText.indexOf("block");
    const firstMissingStart = firstLineText.indexOf("missing");
    const secondForStart = secondLineText.indexOf("wx:for");

    const firstMissingKey = diagnostics.find((item) => item.code === "annil.wxFor.missingKey");
    const missingData = diagnostics.find((item) => item.code === "annil.wxFor.unknownData");
    const mustacheSyntax = diagnostics.find((item) => item.code === "annil.wxFor.mustacheSyntax");
    const secondMissingKey = diagnostics.filter((item) => item.code === "annil.wxFor.missingKey")[1];
    if (
      firstMissingKey === undefined || missingData === undefined || mustacheSyntax === undefined
      || secondMissingKey === undefined
    ) {
      throw new Error("未找到 wx:for 同行定位诊断");
    }

    assert.deepStrictEqual(
      diagnostics.map((item) => [item.code, item.range.start.line, item.range.start.character]),
      [
        ["annil.wxFor.missingKey", 0, firstBlockStart],
        ["annil.wxFor.unknownData", 0, firstMissingStart],
        ["annil.wxFor.missingKey", 1, secondBlockStart],
        ["annil.wxFor.mustacheSyntax", 1, secondForStart],
      ],
    );
    assert.strictEqual(firstMissingKey.range.start.character, firstBlockStart);
    assert.strictEqual(missingData.range.start.character, firstMissingStart);
    assert.strictEqual(mustacheSyntax.range.start.character, secondForStart);
    assert.strictEqual(secondMissingKey.range.start.character, secondBlockStart);
    for (const diagnostic of diagnostics) {
      assert.strictEqual(diagnostic.range.end.line, diagnostic.range.start.line);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    }
  });
});
