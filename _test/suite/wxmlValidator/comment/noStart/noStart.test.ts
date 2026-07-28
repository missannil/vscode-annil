import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/noStart/noStart.wxml");
const END_COMMENT = "<!-- annil disable end -->";

describe("annil 注释：noStart", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await diagnosticsReady;
  });

  test("插入 end 注释前不产生诊断", () => {
    assert.deepStrictEqual(initialDiagnostics, []);
  });

  test("插入没有匹配 start 的 end 注释后产生诊断", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 1);
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(2, 0), `${END_COMMENT}\n`);
    assert.strictEqual(await workspace.applyEdit(edit), true);

    const [diagnostic] = await diagnosticsReady;
    assert.strictEqual(diagnostic.message, "还没有开始注释不可结束");
  });

  // 测试会插入 end 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(2).text !== END_COMMENT) return;

    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(2, 0), new Position(3, 0)));
    assert.strictEqual(await workspace.applyEdit(edit), true);
    assert.strictEqual(await document.save(), true);
    await diagnosticsReady;
  });
});
