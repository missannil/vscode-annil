import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { getQuickFixes } from "../../codeActionHelper.js";
import { applyEditAndWaitForDiagnostics, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/startEnd/startEnd.wxml");
const START_COMMENT = "<!-- annil disable start -->";
const INVALID_COMMENT = "<!-- annil disable invalid -->";
const END_ACTION_TITLE = "替换为：关闭检查结束";
const END_COMMENT_TEXT = "annil disable end";

describe("annil Code Action：startEnd", () => {
  const uri = Uri.file(WXML_PATH);

  test("start 作用域内的无效注释仅提供替换为 end 的 Quick Fix", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    await waitForDiagnostics(uri, (current) => current.length === 2);

    const insertComments = new WorkspaceEdit();
    insertComments.insert(uri, new Position(2, 0), `${START_COMMENT}\n${INVALID_COMMENT}\n`);
    const diagnostics = await applyEditAndWaitForDiagnostics(uri, insertComments, (current) => current.length === 1);
    const diagnostic = diagnostics.find((item) => item.message === "无效的注释");
    assert.ok(diagnostic, "未找到 start 作用域内的无效注释诊断");

    const annilActions = (await getQuickFixes(uri, diagnostic)).filter((action) => action.title === END_ACTION_TITLE);
    assert.strictEqual(annilActions.length, 1);
    const [action] = annilActions;
    assert.strictEqual(action.kind?.value, "quickfix");
    assert.ok(action.edit, `Code Action “${action.title}”未提供编辑`);
    const entries = action.edit.entries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0][0].toString(), uri.toString());
    assert.strictEqual(entries[0][1].length, 1);
    assert.strictEqual(entries[0][1][0].newText, END_COMMENT_TEXT);
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(2).text !== START_COMMENT || document.lineAt(3).text !== INVALID_COMMENT) return;

    const restore = new WorkspaceEdit();
    restore.delete(uri, new Range(new Position(2, 0), new Position(4, 0)));
    await applyEditAndWaitForDiagnostics(uri, restore, (current) => current.length === 2);
  });
});
