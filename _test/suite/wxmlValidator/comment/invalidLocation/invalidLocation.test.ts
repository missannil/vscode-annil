import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, assertDiagnosticDetails, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/invalidLocation/invalidLocation.wxml");
const ALL_COMMENT = "<!-- annil disable all -->";

describe("annil 注释：invalidLocation", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await waitForDiagnostics(uri, (current) => current.length === 0);
  });

  test("插入 all 注释前不产生诊断", () => {
    assert.deepStrictEqual(initialDiagnostics, []);
  });

  test("在第一个元素后插入 all 注释产生位置诊断", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(3, 0), `${ALL_COMMENT}\n`);

    assertDiagnosticDetails((await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 1))[0], {
      message: "注释应写在文件头部",
      source: "vscode-annil",
      code: "annil.comment.invalidLocation",
      range: [3, 5, 3, 22],
    });
  });

  // 测试会插入 all 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(3).text !== ALL_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(3, 0), new Position(4, 0)));
    await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 0, true);
  });
});
