import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { commands, Uri, window, workspace } from "vscode";
import {
  applyCodeActionAndWaitForDiagnostics,
  getQuickFixes,
  waitForQuickFix,
  withRestoredFixture,
} from "../../../../codeActionHelper.js";
import { waitForDiagnostics, waitForDiagnosticUpdate, waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

function hasStructureDiagnostic(diagnostic: vscode.Diagnostic): boolean {
  return diagnostic.code === "annil.wxFor.missingFor" || diagnostic.code === "annil.wxFor.missingKey";
}

describe("wxForStructure", () => {
  test("wx:for 相关属性缺少必要属性时产生诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/structure/structure.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 3);
    assert.strictEqual(diagnostics.length, 3);

    const missingWxFor = diagnostics.find((diagnostic) => diagnostic.message === "缺少wx:for属性");
    const missingWxKeys = diagnostics.filter((diagnostic) => diagnostic.message === "缺少wx:key属性");
    assert.ok(missingWxFor);
    assert.strictEqual(missingWxKeys.length, 2);
    assert.strictEqual(missingWxFor.severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(missingWxFor.code, "annil.wxFor.missingFor");
    missingWxKeys.forEach((diagnostic) => {
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.code, "annil.wxFor.missingKey");
    });

    const lines = document.getText().split("\n");
    const findTagLine = (attributePredicate: (line: string) => boolean): number => {
      const attributeLine = lines.findIndex(attributePredicate);
      for (let line = attributeLine; line >= 0; line--) {
        if (lines[line].includes("<block")) return line;
      }

      return -1;
    };
    const missingWxForLine = findTagLine((line) => line.includes("wx:for-item=\"itemA\""));
    const missingWxKeyLines = [
      findTagLine((line) => line.includes("wx:for-item=\"itemA\"")),
      findTagLine((line) => line.includes("wx:for=\"{{items}}\"") && !line.includes("wx:key")),
    ].sort((a, b) => a - b);
    assert.strictEqual(missingWxFor.range.start.line, missingWxForLine);
    assert.deepStrictEqual(
      missingWxKeys.map((diagnostic) => diagnostic.range.start.line).sort((a, b) => a - b),
      missingWxKeyLines,
    );
    assert.strictEqual(missingWxFor.range.start.character, lines[missingWxForLine].indexOf("block"));
    assert.strictEqual(missingWxFor.range.end.character, missingWxFor.range.start.character + "block".length);
    missingWxKeys.forEach((diagnostic) => {
      assert.strictEqual(diagnostic.range.start.character, lines[diagnostic.range.start.line].indexOf("block"));
      assert.strictEqual(
        diagnostic.range.end.character,
        diagnostic.range.start.character + "block".length,
      );
    });
  });

  test("缺少 wx:for 时提供 Quick Fix", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/structure/structure.wxml",
      ),
    );
    await withRestoredFixture(
      wxmlUri,
      (diagnostics) => diagnostics.some(hasStructureDiagnostic),
      async () => {
        const document = await workspace.openTextDocument(wxmlUri);
        await window.showTextDocument(document);
        const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 3);
        assert.strictEqual(diagnostics.length, 3);
        const missingWxFor = diagnostics.find((diagnostic) => diagnostic.message === "缺少wx:for属性");
        if (missingWxFor === undefined) assert.fail("未找到缺少 wx:for 属性的诊断");

        const action = await waitForQuickFix(wxmlUri, missingWxFor, "添加属性 “wx:for”");
        const actions = await getQuickFixes(wxmlUri, missingWxFor);
        assert.ok(actions.some((item) => item.title === "添加属性 “wx:for”"));
        const fixedDiagnostics = await applyCodeActionAndWaitForDiagnostics(
          wxmlUri,
          action,
          (current) => !current.some((diagnostic) => diagnostic.message === "缺少wx:for属性"),
        );
        const currentDocument = await workspace.openTextDocument(wxmlUri);
        const currentText = currentDocument.getText();
        const variable = "数组类型变量名";
        const variableOffset = currentText.indexOf(variable);
        const firstBlockStart = currentText.indexOf("<block");
        const firstBlockEnd = currentText.indexOf(">", firstBlockStart);
        const firstIndexOffset = currentText.indexOf("wx:for-index", firstBlockStart);
        assert.ok(firstIndexOffset < variableOffset && variableOffset < firstBlockEnd);
        const invalidVariable = fixedDiagnostics.find((diagnostic) =>
          diagnostic.message === `无效的变量: "${variable}"`
        );
        assert.ok(invalidVariable);
        assert.ok(variableOffset >= 0);
        const variableStart = currentDocument.positionAt(variableOffset);
        const variableEnd = currentDocument.positionAt(variableOffset + variable.length);
        assert.strictEqual(invalidVariable.range.start.line, variableStart.line);
        assert.strictEqual(invalidVariable.range.start.character, variableStart.character);
        assert.strictEqual(invalidVariable.range.end.line, variableEnd.line);
        assert.strictEqual(invalidVariable.range.end.character, variableEnd.character);
      },
    );
  });

  test("fix-all 修复所有缺少的 wx:for 和 wx:key", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/structure/structure.wxml",
      ),
    );
    await withRestoredFixture(
      wxmlUri,
      (diagnostics) => diagnostics.some(hasStructureDiagnostic),
      async () => {
        const document = await workspace.openTextDocument(wxmlUri);
        await window.showTextDocument(document);
        const structureDiagnostics = await waitForDiagnostics(
          wxmlUri,
          (current) => current.filter(hasStructureDiagnostic).length === 3,
        );
        assert.strictEqual(structureDiagnostics.filter(hasStructureDiagnostic).length, 3);
        const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => !current.some(hasStructureDiagnostic));
        await commands.executeCommand("annil.fix-all");
        const diagnostics = await diagnosticsReady;
        assert.ok(!diagnostics.some(hasStructureDiagnostic));
      },
    );
  });
});
