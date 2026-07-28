import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Position, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, getQuickFixes } from "../../codeActionHelper.js";
import { applyEditAndWaitForDiagnostics, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/invalidLocation/invalidLocation.wxml");
const ALL_COMMENT = "<!-- annil disable all -->";
const DELETE_ACTION_TITLE = "删除位置错误的 all 注释";

describe("annil Code Action：invalidLocation", () => {
  const uri = Uri.file(WXML_PATH);

  test("非文件头 all 注释可通过 Quick Fix 删除", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    await waitForDiagnostics(uri, (current) => current.length === 0);

    const insertAllComment = new WorkspaceEdit();
    insertAllComment.insert(uri, new Position(3, 0), `${ALL_COMMENT}\n`);
    const [diagnostic] = await applyEditAndWaitForDiagnostics(
      uri,
      insertAllComment,
      (current) => current.length === 1,
    );

    const action = (await getQuickFixes(uri, diagnostic)).find((item) => item.title === DELETE_ACTION_TITLE);
    assert.ok(action, `未找到“${DELETE_ACTION_TITLE}” Quick Fix`);
    assert.strictEqual(action.kind?.value, "quickfix");

    assert.deepStrictEqual(
      await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
      [],
    );
    assert.strictEqual((await workspace.openTextDocument(uri)).getText().includes(ALL_COMMENT), false);
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (!document.getText().includes(ALL_COMMENT)) return;

    const commentLine = document.getText().split("\n").findIndex((line) => line === ALL_COMMENT);
    if (commentLine < 0) return;

    const restore = new WorkspaceEdit();
    restore.delete(uri, document.lineAt(commentLine).rangeIncludingLineBreak);
    await applyEditAndWaitForDiagnostics(uri, restore, (current) => current.length === 0);
  });
});
