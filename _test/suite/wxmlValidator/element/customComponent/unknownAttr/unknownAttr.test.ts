import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("unknownAttr", () => {
  test("未知属性产生诊断，合法属性不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/customComponent/unknownAttr/unknownAttr.wxml"),
    );
    await window.showTextDocument(await workspace.openTextDocument(wxmlUri));
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const unknown = diags.filter((d) => d.message.startsWith("未知属性:"));
    assert.strictEqual(unknown.length, 1);
    assert.strictEqual(unknown[0].message, `未知属性: "unknown"`);
    assert.strictEqual(unknown[0].severity, vscode.DiagnosticSeverity.Warning);
  });
});
