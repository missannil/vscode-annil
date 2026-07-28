import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/startEnd/startEnd.wxml",
);

describe("annil 注释：startEnd", () => {
  let diagnostics: readonly Diagnostic[];

  before(async () => {
    const wxmlUri = Uri.file(WXML_PATH);
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
  });

  test("start 到 end 之间关闭诊断，end 后恢复诊断", () => {
    const [diagnostic] = diagnostics;

    assert.strictEqual(diagnostic.message, "未知数据: \"enabledAfterEnd\"");
    assert.strictEqual(diagnostic.source, undefined);
    assert.strictEqual(diagnostic.code, undefined);
    assert.strictEqual(diagnostic.range.start.line, 3);
    assert.strictEqual(diagnostic.range.start.character, 6);
    assert.strictEqual(diagnostic.range.end.line, 3);
    assert.strictEqual(diagnostic.range.end.character, 25);
  });
});
