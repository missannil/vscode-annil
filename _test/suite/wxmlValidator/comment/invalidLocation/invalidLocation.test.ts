import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/invalidLocation/invalidLocation.wxml");

describe("annil 注释：invalidLocation", () => {
  let diagnostics: readonly Diagnostic[];
  before(async () => {
    const uri = Uri.file(WXML_PATH);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    diagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
  });
  test("all 不在文件头部产生位置诊断", () => {
    assert.strictEqual(diagnostics[0]?.message, "注释应写在文件头部");
  });
});
