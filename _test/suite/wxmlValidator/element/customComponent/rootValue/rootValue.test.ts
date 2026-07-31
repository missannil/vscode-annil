import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("rootValue", () => {
  test("Root 继承属性值不匹配产生诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/customComponent/rootValue/rootValue.wxml"),
    );
    await window.showTextDocument(await workspace.openTextDocument(wxmlUri));
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const valueDiags = diags.filter((d) => d.message.includes("应绑定"));
    assert.strictEqual(valueDiags.length, 1);
    assert.strictEqual(valueDiags[0].message, `属性 "subInline_inheritBool" 应绑定 "{{propRequiredBool}}"`);
    assert.strictEqual(valueDiags[0].severity, vscode.DiagnosticSeverity.Warning);
  });
});
