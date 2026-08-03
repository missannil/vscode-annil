import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

describe("duplicateId", () => {
  let diagnostics: Diagnostic[];

  before(async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/duplicateId/duplicateId.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = [...await waitForDiagnostics(wxmlUri, (current) => current.length === 5)];
  });

  test("重复的 id 产生 5 个诊断", () => {
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["重复的id", "重复的id", "重复的id", "重复的id", "重复的id"],
    );
    diagnostics.forEach((diagnostic) => {
      assert.strictEqual(diagnostic.source, "vscode-annil");
      assert.strictEqual(diagnostic.code, "annil.element.duplicateId");
    });
    // 第一个重复 id="aaa" — 在第 6 行，id=" 位于 col 6，comparableId "aaa" 从 col 10 开始
    assert.strictEqual(diagnostics[0].range.start.line, 5);
    assert.strictEqual(diagnostics[0].range.start.character, 10);
    assert.strictEqual(diagnostics[0].range.end.character, 13);
    // 后缀 aaa id="xxx_aaa" — 在第 8 行，comparableId "aaa" 跳过前缀 "xxx_" 从 col 14 开始
    assert.strictEqual(diagnostics[1].range.start.line, 7);
    assert.strictEqual(diagnostics[1].range.start.character, 14);
    assert.strictEqual(diagnostics[1].range.end.character, 17);
    // annil disable 后的 id="xxx_aaa" — 在第 12 行，定位同上
    assert.strictEqual(diagnostics[2].range.start.line, 11);
    assert.strictEqual(diagnostics[2].range.start.character, 14);
    assert.strictEqual(diagnostics[2].range.end.character, 17);
    // {{index}}_aaa — 在第 21 行，tab 缩进 1 字符，comparableId "aaa" 从 col 21 开始
    assert.strictEqual(diagnostics[3].range.start.line, 20);
    assert.strictEqual(diagnostics[3].range.start.character, 21);
    assert.strictEqual(diagnostics[3].range.end.character, 24);
    // {{ index }} 规范化后与 {{index}} 重复 — 在第 25 行，只标内部变量 "index" col 14→19
    assert.strictEqual(diagnostics[4].range.start.line, 24);
    assert.strictEqual(diagnostics[4].range.start.character, 14);
    assert.strictEqual(diagnostics[4].range.end.character, 19);
  });
});
