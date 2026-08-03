import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("chunkEvent", () => {
  test("ChunkComponent 事件必须在当前 chunk 中定义", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/chunkComponent/chunkEvent/chunkEvent.wxml"),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);
    assert.strictEqual(diagnostics.length, 1);

    const diagnostic = diagnostics[0];
    const value = "missingHandler";
    const line = document.lineAt(diagnostic.range.start.line).text;
    const start = line.indexOf(value);
    assert.strictEqual(diagnostic.message, "事件 \"bind:tap\" 未在 ChunkComponent 中定义: \"missingHandler\"");
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(diagnostic.code, "annil.chunkEvent.unknown");
    assert.strictEqual(diagnostic.range.start.line, 2);
    assert.strictEqual(diagnostic.range.start.character, start);
    assert.strictEqual(diagnostic.range.end.line, 2);
    assert.strictEqual(diagnostic.range.end.character, start + value.length);
  });
});
