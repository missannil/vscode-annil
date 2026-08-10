import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri } from "vscode";
import {
  applyCodeActionAndWaitForDiagnostics,
  waitForQuickFix,
  withRestoredFixture,
} from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("missingAttrSelfClosing", () => {
  test("自闭合组件标签缺少属性时，Quick Fix 把属性插到 `/` 之前", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttrSelfClosing/missingAttrSelfClosing.wxml",
      ),
    );
    const hasMissing = (current: readonly vscode.Diagnostic[]): boolean =>
      current.some((diagnostic) => diagnostic.message.startsWith("缺少属性:"));

    await withRestoredFixture(wxmlUri, hasMissing, async () => {
      const document = await vscode.workspace.openTextDocument(wxmlUri);
      await vscode.window.showTextDocument(document);
      const diags = await waitForStableDiagnostics(wxmlUri, 1);
      const missing = diags.filter((d) => d.message.startsWith("缺少属性:"));
      assert.strictEqual(missing.length, 1);
      assert.strictEqual(missing[0].message, "缺少属性: \"inheritBool\"");

      const action = await waitForQuickFix(wxmlUri, missing[0], "添加属性 “inheritBool”");
      await applyCodeActionAndWaitForDiagnostics(wxmlUri, action, (current) => !hasMissing(current));

      // 回归：属性必须插在自闭合 `/` 之前，而不是 `/` 和 `>` 之间。
      const editedText = document.getText();
      assert.ok(
        editedText.includes("<subInline  inheritBool=\"{{propRequiredBool}}\"/>"),
        `自闭合标签插入位置错误，实际文本：\n${editedText}`,
      );
      assert.ok(!editedText.includes("/ inheritBool"), "属性被错误插到 `/` 和 `>` 之间");
    });
  });
});
