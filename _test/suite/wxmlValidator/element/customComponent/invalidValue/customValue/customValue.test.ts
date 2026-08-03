import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("customValue", () => {
  test("Custom 值必须使用当前 WXML 作用域中的变量", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/invalidValue/customValue/customValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);
    const unknownData = diagnostics.filter((item) => item.message === "未知数据: \"item\"");
    assert.strictEqual(unknownData.length, 1);
    assert.strictEqual(unknownData[0].source, "vscode-annil");
    assert.strictEqual(unknownData[0].code, "annil.customComponent.unknownData");
    assert.strictEqual(unknownData[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(unknownData[0].range.start.line, 1);
    assert.strictEqual(
      unknownData[0].range.start.character,
      document.lineAt(1).text.indexOf("{{item}}") + 2,
    );
    assert.strictEqual(unknownData[0].range.end.line, 1);
    assert.strictEqual(unknownData[0].range.end.character, unknownData[0].range.start.character + 4);
  });
});
