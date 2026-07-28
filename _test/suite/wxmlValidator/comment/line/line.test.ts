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
  "_test/suite/wxmlValidator/comment/line/line.wxml",
);
const LINE_COMMENT = "<!-- annil disable line -->";

describe("annil 注释：line", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    initialDiagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
  });

  test("插入 line 注释前，下一元素产生未知数据诊断", () => {
    assert.deepStrictEqual(
      initialDiagnostics.map((diagnostic) => diagnostic.message),
      ["未知数据: \"xxx\""],
    );
  });

  test("插入 line 注释后，下一元素的未知数据诊断消失", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => current.length === 0);
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(2, 0), `${LINE_COMMENT}\n`);
    assert.strictEqual(await workspace.applyEdit(edit), true);

    assert.deepStrictEqual(await diagnosticsReady, []);
  });

  // 测试会插入 line 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (document.lineAt(2).text !== LINE_COMMENT) return;

    const diagnosticsReady = waitForDiagnosticUpdate(wxmlUri, (current) => current.length === 1);
    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(2, 0), new Position(3, 0)));
    assert.strictEqual(await workspace.applyEdit(edit), true);
    assert.strictEqual(await document.save(), true);
    await diagnosticsReady;
  });
});
