import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("eventsValue", () => {
  test("Events 事件绑定值不匹配产生诊断", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/invalidValue/eventsValue/eventsValue.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
    const eventDiags = diags.filter((d) => d.message.includes("应绑定"));
    assert.strictEqual(eventDiags.length, 1);
    assert.strictEqual(eventDiags[0].message, `事件属性 "bind:onTap" 应绑定 "subInline_onTap"`);
    assert.strictEqual(eventDiags[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(eventDiags[0].source, "vscode-annil");
    assert.strictEqual(eventDiags[0].code, "annil.customComponent.eventValueMismatch");
    assert.strictEqual(eventDiags[0].range.start.line, 4);
    assert.strictEqual(eventDiags[0].range.start.character, 23);
    assert.strictEqual(eventDiags[0].range.end.line, 4);
    assert.strictEqual(eventDiags[0].range.end.character, 28);
    await verifyQuickFixAndFixAll(
      wxmlUri,
      eventDiags[0],
      "修复事件属性 “bind:onTap” 为 “subInline_onTap”",
      (current) => current.some((diagnostic) => diagnostic.message.includes("应绑定")),
    );
  });
});
