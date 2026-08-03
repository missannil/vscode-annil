import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("nativeEventUnknown", () => {
  test("原生 bind/catch 事件必须在 RootComponent 中定义", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/event/unknown/unknown.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);
    assert.deepStrictEqual(diagnostics.map((diagnostic) => diagnostic.message), ["无效事件"]);

    const value = "missingHandler";
    const lineText = document.lineAt(diagnostics[0].range.start.line).text;
    const start = lineText.indexOf(value);
    assert.strictEqual(diagnostics[0].source, "vscode-annil");
    assert.strictEqual(diagnostics[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(diagnostics[0].code, "annil.nativeEvent.unknown");
    assert.strictEqual(diagnostics[0].range.start.line, 1);
    assert.strictEqual(diagnostics[0].range.start.character, start);
    assert.strictEqual(diagnostics[0].range.end.line, 1);
    assert.strictEqual(diagnostics[0].range.end.character, start + value.length);
  });
});
