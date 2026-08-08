import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionChunkComponentScope", () => {
  test("按 CustomComponent 和 ChunkComponent 作用域校验条件数据", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/chunkComponent/condition/componentScope/componentScope.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);
    const unknownValues = diagnostics.filter((item) => item.code === "annil.condition.unknownValue");
    assert.strictEqual(unknownValues.length, 1);
    const diagnostic = unknownValues.find((item) => item.message === "未知数据: \"chunkInline_visible\"");
    assert.ok(diagnostic);
    const line = diagnostic.range.start.line;
    const lineText = document.lineAt(line).text;
    const start = lineText.indexOf("chunkInline_visible");
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.range.start.line, line);
    assert.strictEqual(diagnostic.range.start.character, start);
    assert.strictEqual(diagnostic.range.end.character, start + "chunkInline_visible".length);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(unknownValues.some((item) => item.message.includes("chunkBlock_visible")), false);
  });
});
