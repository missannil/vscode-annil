import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("missingAttrSelf", () => {
  test("缺少 Self 属性支持 Quick Fix 和 fix-all", async () => {
    const uri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttrSelf/missingAttrSelf.wxml",
      ),
    );
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForStableDiagnostics(uri, 1);
    const diagnostic = diagnostics.find((item) => item.message === "缺少属性: \"_cid\"");
    assert.ok(diagnostic);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    await verifyQuickFixAndFixAll(
      uri,
      diagnostic,
      "添加属性 “_cid”",
      (current) => current.some((item) => item.message === "缺少属性: \"_cid\""),
    );
  });
});
