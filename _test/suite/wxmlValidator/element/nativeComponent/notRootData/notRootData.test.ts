import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("notRootData", () => {
  test("未定义数据产生诊断，已定义数据不误报", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/nativeComponent/notRootData/notRootData.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    const diagnostics = await waitForStableDiagnostics(wxmlUri, 1);

    // 仅应有 1 条未知数据诊断
    const unknownDiags = diagnostics.filter((d) => d.message.startsWith("未知数据:"));
    assert.strictEqual(unknownDiags.length, 1);

    assert.strictEqual(unknownDiags[0].message, `未知数据: "undefData"`);
    assert.strictEqual(unknownDiags[0].severity, vscode.DiagnosticSeverity.Error);
  });
});
