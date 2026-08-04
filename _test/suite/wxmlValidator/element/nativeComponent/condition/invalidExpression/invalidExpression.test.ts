import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionInvalidExpression", () => {
  test("报告非法条件表达式并忽略合法条件", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/invalidExpression/invalidExpression.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
    assert.strictEqual(diagnostics.length, 2);

    for (const line of [1, 3]) {
      const diagnostic = diagnostics.find((item) => item.range.start.line === line);
      assert.ok(diagnostic);
      const start = document.lineAt(line).text.indexOf("{{");
      const end = document.lineAt(line).text.indexOf("}}") + 2;
      assert.strictEqual(diagnostic.message, "条件表达式无效");
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, "annil.condition.invalidExpression");
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.line, line);
      assert.strictEqual(diagnostic.range.end.character, end);
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    }
  });
});
