import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import {
  applyCodeActionAndWaitForDiagnostics,
  waitForQuickFix,
  withRestoredFixture,
} from "../../../../codeActionHelper.js";
import { waitForDiagnostics, waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionMissingValue", () => {
  test("wx:if 和 wx:elif 不可无值", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/missingValue/missingValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["wx:if 不可无值", "wx:elif 不可无值"],
    );

    const expectedAttributes = ["wx:if", "wx:elif"];
    diagnostics.forEach((diagnostic, index) => {
      const attribute = expectedAttributes[index];
      const start = document.lineAt(diagnostic.range.start.line).text.indexOf(attribute);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.missingValue");
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.character, start + attribute.length);
    });
  });

  test("为缺少值的条件属性补充占位表达式", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/missingValue/missingValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(
      wxmlUri,
      (current) => current.filter((item) => item.code === "annil.condition.missingValue").length === 2,
    );
    const diagnostic = diagnostics.find((item) => item.range.start.line === 0);
    assert.ok(diagnostic);

    await withRestoredFixture(
      wxmlUri,
      (current) => current.filter((item) => item.code === "annil.condition.missingValue").length === 2,
      async () => {
        const action = await waitForQuickFix(wxmlUri, diagnostic, "补充 wx:if 的值");
        const remaining = await applyCodeActionAndWaitForDiagnostics(
          wxmlUri,
          action,
          (current) => current.filter((item) => item.code === "annil.condition.missingValue").length === 1,
        );
        assert.strictEqual(remaining.filter((item) => item.code === "annil.condition.missingValue").length, 1);
        assert.strictEqual(
          (await workspace.openTextDocument(wxmlUri)).getText().includes("<block wx:if=\"{{布尔表达式}}\"></block>"),
          true,
        );
      },
    );
  });

  test("fix-all 补充全部缺少的条件值", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/missingValue/missingValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    await waitForDiagnostics(
      wxmlUri,
      (current) => current.filter((item) => item.code === "annil.condition.missingValue").length === 2,
    );
    const originalText = document.getText();
    try {
      await vscode.commands.executeCommand("annil.fix-all");
      const diagnostics = await waitForDiagnostics(
        wxmlUri,
        (current) => current.every((item) => item.code !== "annil.condition.missingValue"),
      );
      assert.strictEqual(diagnostics.filter((item) => item.code === "annil.condition.missingValue").length, 0);
      const text = (await workspace.openTextDocument(wxmlUri)).getText();
      assert.strictEqual(text.includes("<block wx:if=\"{{布尔表达式}}\"></block>"), true);
      assert.strictEqual(text.includes("<block wx:elif=\"{{布尔表达式}}\"></block>"), true);
    } finally {
      const currentDocument = await workspace.openTextDocument(wxmlUri);
      const restore = new vscode.WorkspaceEdit();
      restore.replace(
        wxmlUri,
        new vscode.Range(new vscode.Position(0, 0), currentDocument.positionAt(currentDocument.getText().length)),
        originalText,
      );
      assert.strictEqual(await workspace.applyEdit(restore), true);
      assert.strictEqual(await currentDocument.save(), true);
    }
  });
});
