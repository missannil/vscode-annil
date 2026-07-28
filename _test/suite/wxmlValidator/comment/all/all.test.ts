import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/all/all.wxml",
);

describe("annil 注释：all", () => {
  let diagnostics: readonly Diagnostic[];

  before(async () => {
    const wxmlUri = Uri.file(WXML_PATH);
    const diagnosticsReady = waitForDiagnosticUpdate(
      wxmlUri,
      (current) => current.length === 0,
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = await diagnosticsReady;
  });

  test("文件头的 all 注释关闭后续元素诊断", () => {
    assert.deepStrictEqual(diagnostics, []);
  });
});
