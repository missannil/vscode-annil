import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("missingAttr", () => {
  test("缺少必须属性产生诊断，已写全属性不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/customComponent/missingAttr/missingAttr.wxml"),
    );
    await window.showTextDocument(await workspace.openTextDocument(wxmlUri));
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const missing = diags.filter((d) => d.message.startsWith("缺少属性:"));
    assert.strictEqual(missing.length, 1);
    assert.strictEqual(missing[0].severity, vscode.DiagnosticSeverity.Warning);
  });
});
