import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { commands, Uri, window, workspace } from "vscode";
import { getQuickFixes, withRestoredFixture } from "../../../../codeActionHelper.js";
import { waitForDiagnostics, waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("conditionElseValue", () => {
  test("wx:else 有值时产生诊断，合法无值属性不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/elseValue/elseValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["不应有值"],
    );

    const expectedLocations = [{ line: 1, attribute: "wx:else" }];
    diagnostics.forEach((diagnostic, index) => {
      const { line, attribute } = expectedLocations[index];
      const start = document.lineAt(line).text.indexOf(attribute);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.condition.elseHasValue");
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.line, line);
      assert.strictEqual(diagnostic.range.end.character, start + attribute.length);
    });
  });

  test("wx:else 值提供 Quick Fix", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/elseValue/elseValue.wxml",
      ),
    );
    await withRestoredFixture(
      wxmlUri,
      (diagnostics) => diagnostics.some((item) => item.code === "annil.condition.elseHasValue"),
      async () => {
        const document = await workspace.openTextDocument(wxmlUri);
        await window.showTextDocument(document);
        const diagnostics = vscode.languages.getDiagnostics(wxmlUri);
        assert.strictEqual(diagnostics.length, 1);
        const diagnostic = diagnostics[0];
        if (diagnostic === undefined) return;
        const availableActions = await getQuickFixes(wxmlUri, diagnostic);
        const action = availableActions.find((item) => item.title === "移除 wx:else 的值");
        const edit = action?.edit;
        if (edit === undefined) return;
        assert.strictEqual(await workspace.applyEdit(edit), true);
        assert.strictEqual(
          (await workspace.openTextDocument(wxmlUri)).getText().includes("wx:else=\"unexpected\""),
          false,
        );
        const fixedDiagnostics = await waitForDiagnostics(
          wxmlUri,
          (current) => !current.some((item) => item.code === "annil.condition.elseHasValue"),
        );
        assert.strictEqual(
          fixedDiagnostics.filter((item) => item.code === "annil.condition.elseHasValue").length,
          0,
        );
        assert.strictEqual(
          (await workspace.openTextDocument(wxmlUri)).getText().includes("wx:else=\"unexpected\""),
          false,
        );
      },
    );
  });

  test("fix-all 修复所有 wx:else 值诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/condition/elseValue/elseValue.wxml",
      ),
    );
    await withRestoredFixture(
      wxmlUri,
      (diagnostics) => diagnostics.some((item) => item.code === "annil.condition.elseHasValue"),
      async () => {
        const document = await workspace.openTextDocument(wxmlUri);
        await window.showTextDocument(document);
        assert.strictEqual(vscode.languages.getDiagnostics(wxmlUri).length, 1);
        await commands.executeCommand("annil.fix-all");
        await waitForDiagnostics(
          wxmlUri,
          (current) => !current.some((item) => item.code === "annil.condition.elseHasValue"),
        );
        const fixedText = (await workspace.openTextDocument(wxmlUri)).getText();
        assert.strictEqual(fixedText.includes("wx:else=\"unexpected\""), false);
        assert.strictEqual(fixedText.includes("wx:else=\"\""), false);
      },
    );
  });
});
