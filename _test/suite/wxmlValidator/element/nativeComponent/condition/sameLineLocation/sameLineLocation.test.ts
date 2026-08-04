import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionSameLineLocation", () => {
  test("定位同一行第二个 block 的条件属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/sameLineLocation/sameLineLocation.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
    const [diagnostic] = diagnostics;
    const line = 1;
    const lineText = document.lineAt(line).text;
    const secondValue = "{{ }}";
    const secondAttributeStart = lineText.indexOf(secondValue);

    assert.strictEqual(diagnostic.message, "条件表达式无效");
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.code, "annil.condition.invalidExpression");
    assert.strictEqual(diagnostic.range.start.line, line);
    assert.strictEqual(diagnostic.range.start.character, secondAttributeStart);
    assert.strictEqual(diagnostic.range.end.line, line);
    assert.strictEqual(diagnostic.range.end.character, secondAttributeStart + secondValue.length);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
  });
});
