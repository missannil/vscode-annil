import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { waitForDiagnostics, waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/all/all.wxml",
);
const ALL_COMMENT = "<!-- annil disable all -->";

describe("annil 注释：all", () => {
  let diagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 3);
  });

  test("未添加 all 注释时两个未知组件和重复 id 分别产生诊断", () => {
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["重复的id", "未知标签", "未知标签"],
    );
  });

  test("加入文件头 all 注释后仅保留重复 id 诊断", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => current.length === 1);
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(0, 0), `${ALL_COMMENT}\n`);
    assert.strictEqual(await workspace.applyEdit(edit), true);

    assert.deepStrictEqual(
      (await diagnosticsReady).map((diagnostic) => diagnostic.message),
      ["重复的id"],
    );
  });

  // 测试会修改真实 fixture，结束后恢复源码，避免后续测试读取到 all 注释。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (!document.getText().startsWith(`${ALL_COMMENT}\n`)) return;

    const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => current.length === 3);
    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(0, 0), new Position(1, 0)));
    assert.strictEqual(await workspace.applyEdit(edit), true);
    assert.strictEqual(await document.save(), true);
    await diagnosticsReady;
  });
});
