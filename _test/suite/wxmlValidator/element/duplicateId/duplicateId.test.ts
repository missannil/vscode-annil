import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { languages, Uri, window, workspace } from "vscode";

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

    await new Promise((resolve) => setTimeout(resolve, 500));
    diagnostics = languages.getDiagnostics(wxmlUri);
  });

  test("重复的 id 产生 4 个诊断", () => {
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["重复的id", "重复的id", "重复的id", "重复的id"],
    );
    // 第一个重复 id="aaa" — 在第 4 行
    assert.strictEqual(diagnostics[0].range.start.line, 4);
    // annil disable 后的 id="aaa" — 在第 8 行
    assert.strictEqual(diagnostics[1].range.start.line, 8);
    // {{fff}}_aaa — 在第 14 行
    assert.strictEqual(diagnostics[2].range.start.line, 14);
    // {{xxx}}_bbb — 在第 18 行
    assert.strictEqual(diagnostics[3].range.start.line, 18);
  });
});
