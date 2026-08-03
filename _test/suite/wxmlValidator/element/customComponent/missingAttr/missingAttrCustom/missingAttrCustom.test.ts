import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("missingAttrCustom", () => {
  test("缺少 Custom 属性支持 Quick Fix 和 fix-all", async () => {
    const uri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttrCustom/missingAttrCustom.wxml",
      ),
    );
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForStableDiagnostics(uri, 1);
    assert.ok(!diagnostics.some((item) => item.message === "未知数据: \"item\""));
    const diagnostic = diagnostics.find((item) => item.message === "缺少属性: \"subInline_customValue\"");
    assert.ok(diagnostic);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    await verifyQuickFixAndFixAll(
      uri,
      diagnostic,
      "添加属性 “subInline_customValue”",
      (current) => current.some((item) => item.message === "缺少属性: \"subInline_customValue\""),
    );
  });
});
