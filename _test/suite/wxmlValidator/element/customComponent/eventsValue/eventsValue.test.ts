import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("eventsValue", () => {
  test("Events 事件绑定值不匹配产生诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/customComponent/eventsValue/eventsValue.wxml"),
    );
    await window.showTextDocument(await workspace.openTextDocument(wxmlUri));
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const eventDiags = diags.filter((d) => d.message.includes("应绑定"));
    assert.strictEqual(eventDiags.length, 1);
    assert.strictEqual(eventDiags[0].message, `事件属性 "bind:onTap" 应绑定 "subInline_onTap"`);
    assert.strictEqual(eventDiags[0].severity, vscode.DiagnosticSeverity.Warning);
  });
});
