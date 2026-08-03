import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { verifyQuickFixAndFixAll } from "../../../../codeActionHelper.js";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("kebabCase", () => {
  test("kebab-case 属性名支持规范化并正确识别未知属性", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/unknownAttr/kebabCase/kebabCase.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const unknown = diags.filter((d) => d.message.startsWith("未知属性:"));
    assert.strictEqual(unknown.length, 1);
    assert.strictEqual(unknown[0].message, "未知属性: \"unknown-attr\"");
    assert.strictEqual(unknown[0].severity, vscode.DiagnosticSeverity.Error);
    const unknownLine = document.getText().split("\n").findIndex((line) => line.includes("unknown-attr"));
    const unknownStart = document.lineAt(unknownLine).text.indexOf("unknown-attr");
    assert.strictEqual(unknown[0].range.start.line, unknownLine);
    assert.strictEqual(unknown[0].range.start.character, unknownStart);
    assert.strictEqual(unknown[0].range.end.character, unknownStart + "unknown-attr".length);
    await verifyQuickFixAndFixAll(
      wxmlUri,
      unknown[0],
      "移除未知属性 “unknown-attr”",
      (current) => current.some((diagnostic) => diagnostic.message.startsWith("未知属性:")),
    );
  });
});
