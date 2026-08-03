import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("rootValue", () => {
  test("Root 继承属性值不匹配产生诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/customComponent/invalidValue/rootValue/rootValue.wxml"),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const valueDiags = diags.filter((d) => d.message.includes("应绑定"));
    assert.strictEqual(valueDiags.length, 1);
    assert.strictEqual(valueDiags[0].message, `属性 "subInline_inheritBool" 应绑定 "{{propRequiredBool}}"`);
    assert.strictEqual(valueDiags[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(valueDiags[0].source, "vscode-annil");
    assert.strictEqual(valueDiags[0].code, "annil.customComponent.attributeValueMismatch");
    assert.strictEqual(valueDiags[0].range.start.line, 3);
    assert.strictEqual(valueDiags[0].range.start.character, 36);
    assert.strictEqual(valueDiags[0].range.end.line, 3);
    assert.strictEqual(valueDiags[0].range.end.character, 41);
    await verifyQuickFixAndFixAll(
      wxmlUri,
      valueDiags[0],
      "修复属性 “subInline_inheritBool”",
      (current) => current.some((diagnostic) => diagnostic.message.includes("应绑定")),
    );
  });
});
