import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("missingAttrRoot", () => {
  test("缺少 Root 继承属性支持 Quick Fix 和 fix-all", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttrRoot/missingAttrRoot.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const missing = diags.filter((d) => d.message.startsWith("缺少属性:"));
    assert.strictEqual(missing.length, 1);
    assert.strictEqual(missing[0].message, "缺少属性: \"subInline_inheritBool\"");
    assert.strictEqual(missing[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(missing[0].range.start.line, 4);
    assert.strictEqual(missing[0].range.start.character, 1);
    assert.strictEqual(missing[0].range.end.character, 10);
    await verifyQuickFixAndFixAll(
      wxmlUri,
      missing[0],
      "添加属性 “subInline_inheritBool”",
      (current) => current.some((diagnostic) => diagnostic.message.startsWith("缺少属性:")),
    );
  });
});
