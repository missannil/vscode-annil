import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../");

describe("chunkData", () => {
  test("chunk 作用域内 chunk data + rootData 有效，作用域外 chunk data 报未知数据", async () => {
    const wxmlUri = Uri.file(
      path.join(projectRoot, "_test/suite/wxmlValidator/element/chunkComponent/chunkData/chunkData.wxml"),
    );
    await window.showTextDocument(await workspace.openTextDocument(wxmlUri));

    const diags = await waitForStableDiagnostics(wxmlUri, 1);
    const unknownDiags = diags.filter((d) => d.message.startsWith("未知数据:"));
    // 仅作用域外的 chunkInline_visible 应报未知数据
    assert.strictEqual(unknownDiags.length, 1);
    assert.strictEqual(unknownDiags[0].message, `未知数据: "chunkInline_visible"`);
    assert.strictEqual(unknownDiags[0].severity, vscode.DiagnosticSeverity.Error);
  });
});
