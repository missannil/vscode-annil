import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("missingAttrEvents", () => {
  test("缺少 Events 属性支持 Quick Fix 和 fix-all", async () => {
    const uri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttrEvents/missingAttrEvents.wxml",
      ),
    );
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForStableDiagnostics(uri, 1);
    const diagnostic = diagnostics.find((item) => item.message === "缺少属性: \"bind:onTap\"");
    assert.ok(diagnostic);
    assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.code, "annil.customComponent.missingAttribute");
    const tagLine = document.getText().split("\n").findIndex((line) => line === "<subInline></subInline>");
    const tagStart = document.lineAt(tagLine).text.indexOf("subInline");
    assert.strictEqual(diagnostic.range.start.line, tagLine);
    assert.strictEqual(diagnostic.range.start.character, tagStart);
    assert.strictEqual(diagnostic.range.end.line, tagLine);
    assert.strictEqual(diagnostic.range.end.character, tagStart + "subInline".length);
    await verifyQuickFixAndFixAll(
      uri,
      diagnostic,
      "添加属性 “bind:onTap”",
      (current) => current.some((item) => item.message === "缺少属性: \"bind:onTap\""),
    );
  });
});
