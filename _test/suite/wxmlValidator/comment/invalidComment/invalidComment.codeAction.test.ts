import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { getQuickFixes } from "../../codeActionHelper.js";
import { applyEditAndWaitForDiagnostics, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/invalidComment/invalidComment.wxml");
const INVALID_COMMENT = "<!-- annil disable invalid -->";

const expectedFixes = new Map<string, string>([
  ["替换为：全局关闭检查", "annil disable all"],
  ["替换为：关闭下一行检查", "annil disable line"],
  ["替换为：关闭检查开始", "annil disable start"],
]);

describe("annil Code Action：invalidComment", () => {
  const uri = Uri.file(WXML_PATH);

  test("文件头无效注释提供 all、line、start 三种替换 Quick Fix", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    await waitForDiagnostics(uri, (current) => current.length === 1);

    const insertInvalidComment = new WorkspaceEdit();
    insertInvalidComment.insert(uri, new Position(1, 0), `${INVALID_COMMENT}\n`);
    const diagnostics = await applyEditAndWaitForDiagnostics(
      uri,
      insertInvalidComment,
      (current) => current.length === 2,
    );
    const diagnostic = diagnostics.find((item) => item.message === "无效的注释");

    assert.ok(diagnostic, "未找到无效注释诊断");

    const actions = (await getQuickFixes(uri, diagnostic)).filter((action) => expectedFixes.has(action.title));
    assert.deepStrictEqual(
      actions.map((action) => action.title),
      [...expectedFixes.keys()],
    );

    for (const action of actions) {
      assert.strictEqual(action.kind?.value, "quickfix");
      assert.ok(action.edit, `Code Action “${action.title}”未提供编辑`);
      const entries = action.edit.entries();
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0][0].toString(), uri.toString());
      assert.strictEqual(entries[0][1].length, 1);
      assert.strictEqual(entries[0][1][0].newText, expectedFixes.get(action.title));
    }
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(1).text !== INVALID_COMMENT) return;

    const restore = new WorkspaceEdit();
    restore.delete(uri, new Range(new Position(1, 0), new Position(2, 0)));
    await applyEditAndWaitForDiagnostics(uri, restore, (current) => current.length === 1);
  });
});
