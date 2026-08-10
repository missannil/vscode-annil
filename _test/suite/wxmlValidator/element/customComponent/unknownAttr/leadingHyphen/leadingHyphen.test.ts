import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("leadingHyphen", () => {
  test("`-` 开头属性名报未知属性，诊断范围覆盖真实属性名，并支持移除 Quick Fix", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/unknownAttr/leadingHyphen/leadingHyphen.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const unknown = diags.filter((d) => d.message.startsWith("未知属性:"));
    assert.strictEqual(unknown.length, 1);
    assert.strictEqual(unknown[0].message, `未知属性: "-btnType"`);
    assert.strictEqual(unknown[0].severity, vscode.DiagnosticSeverity.Error);
    assert.strictEqual(unknown[0].source, "vscode-annil");
    assert.strictEqual(unknown[0].code, "annil.customComponent.unknownAttribute");
    // 回归：`-` 开头属性名的诊断范围必须真实覆盖属性名，而不是 0 长度范围。
    const unknownLine = document.getText().split("\n").findIndex((line) => line.includes("-btnType="));
    const unknownStart = document.lineAt(unknownLine).text.indexOf("-btnType");
    assert.strictEqual(unknown[0].range.start.line, unknownLine);
    assert.strictEqual(unknown[0].range.start.character, unknownStart);
    assert.strictEqual(unknown[0].range.end.line, unknownLine);
    assert.strictEqual(unknown[0].range.end.character, unknownStart + "-btnType".length);
    await verifyQuickFixAndFixAll(
      wxmlUri,
      unknown[0],
      "移除未知属性 “-btnType”",
      (current) => current.some((diagnostic) => diagnostic.message.startsWith("未知属性:")),
    );
  });
});
