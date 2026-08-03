import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import {
  applyCodeActionAndWaitForDiagnostics,
  waitForQuickFix,
  withRestoredFixture,
} from "../../../../codeActionHelper.js";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("wxForUnknownAttribute", () => {
  test("block 仅允许条件和循环控制属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/unknownAttribute/unknownAttribute.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
    assert.strictEqual(diagnostics.length, 2);

    for (const [attributeName, line] of [["unknownAttr", 2], ["anotherUnknownAttr", 3]] as const) {
      const diagnostic = diagnostics.find((item) => item.message === `未知属性: "${attributeName}"`);
      assert.ok(diagnostic);
      const start = document.lineAt(line).text.indexOf(attributeName);
      assert.strictEqual(diagnostic.message, `未知属性: "${attributeName}"`);
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, "annil.block.unknownAttribute");
      assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
      assert.strictEqual(diagnostic.range.start.line, line);
      assert.strictEqual(diagnostic.range.start.character, start);
      assert.strictEqual(diagnostic.range.end.line, line);
      assert.strictEqual(diagnostic.range.end.character, start + attributeName.length);
    }
  });

  test("移除 block 未知属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/unknownAttribute/unknownAttribute.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
    const diagnostic = diagnostics.find((item) => item.message === `未知属性: "unknownAttr"`);
    assert.ok(diagnostic);
    const actionTitle = "移除未知属性 “unknownAttr”";

    await withRestoredFixture(wxmlUri, (current) => current.length === 2, async () => {
      const action = await waitForQuickFix(wxmlUri, diagnostic, actionTitle);
      const remaining = await applyCodeActionAndWaitForDiagnostics(wxmlUri, action, (current) => current.length === 1);
      assert.strictEqual(remaining.length, 1);
      const text = (await workspace.openTextDocument(wxmlUri)).getText();
      assert.strictEqual(text.includes("unknownAttr"), false);
      assert.strictEqual(text.includes("anotherUnknownAttr"), true);
    });
  });

  test("fix-all 移除全部 block 未知属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/wxFor/unknownAttribute/unknownAttribute.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
    const originalText = document.getText();
    try {
      await vscode.commands.executeCommand("annil.fix-all");
      const remaining = await waitForDiagnostics(
        wxmlUri,
        (current) => current.every((item) => item.code !== "annil.block.unknownAttribute"),
      );
      assert.strictEqual(remaining.length, 1);
      assert.strictEqual(remaining[0].code, "annil.block.empty");
      const text = (await workspace.openTextDocument(wxmlUri)).getText();
      assert.strictEqual(text.includes("unknownAttr"), false);
      assert.strictEqual(text.includes("anotherUnknownAttr"), false);
      assert.strictEqual(text.includes("<block\n></block>"), true);
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
