import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/repeated/repeated.wxml");

describe("annil 注释：repeated", () => {
  let diagnostics: readonly Diagnostic[];
  before(async () => {
    const uri = Uri.file(WXML_PATH);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    diagnostics = await waitForDiagnostics(uri, (current) => current.length === 3);
  });
  test("重复的 line、start、repeatTag 注释分别产生诊断", () => {
    assert.deepStrictEqual(diagnostics.map((diagnostic) => diagnostic.message), [
      "重复的注释",
      "重复的注释",
      "重复的注释",
    ]);
  });
});
