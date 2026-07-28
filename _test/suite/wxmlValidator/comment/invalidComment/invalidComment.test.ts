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
  "_test/suite/wxmlValidator/comment/invalidComment/invalidComment.wxml",
);

describe("annil 注释：invalidComment", () => {
  let diagnostics: readonly Diagnostic[];

  before(async () => {
    const wxmlUri = Uri.file(WXML_PATH);
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
  });

  test("无效的注释", () => {
    const [diagnostic] = diagnostics;

    assert.strictEqual(diagnostic.message, "无效的注释");
    assert.strictEqual(diagnostic.source, "vscode-annil");
    assert.strictEqual(diagnostic.code, undefined);
    assert.strictEqual(diagnostic.range.start.line, 0);
    // 验证器按完整的 annil 注释文本定位，而非仅定位无效的 "invalid" 后缀。
    assert.strictEqual(diagnostic.range.start.character, 5);
    assert.strictEqual(diagnostic.range.end.line, 0);
    assert.strictEqual(diagnostic.range.end.character, 26);
  });
});
