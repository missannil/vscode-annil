import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/noStart/noStart.wxml");

describe("annil 注释：noStart", () => {
  let diagnostics: readonly Diagnostic[];
  before(async () => {
    const uri = Uri.file(WXML_PATH);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    diagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
  });
  test("没有 start 时使用 end 产生诊断", () => {
    assert.strictEqual(diagnostics[0]?.message, "还没有开始注释不可结束");
  });
});
