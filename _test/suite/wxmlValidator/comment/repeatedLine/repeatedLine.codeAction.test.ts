import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Position, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, getQuickFixes } from "../../codeActionHelper.js";
import { applyEditAndWaitForDiagnostics, waitForDiagnostics, waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/repeatedLine/repeatedLine.wxml");
const LINE_COMMENT = "<!-- annil disable line -->";
const DELETE_ACTION_TITLE = "删除重复的注释";

async function openFixtureAndWaitForInitialDiagnostics(uri: Uri): Promise<void> {
  const wasOpen = workspace.textDocuments.some((document) => document.uri.toString() === uri.toString());
  const diagnosticsReady = wasOpen ? undefined : waitForDiagnosticUpdate(uri, (current) => current.length === 0);
  const document = await workspace.openTextDocument(uri);
  await window.showTextDocument(document);

  await (diagnosticsReady ?? waitForDiagnostics(uri, (current) => current.length === 0));
}

describe("annil Code Action：repeatedLine", () => {
  const uri = Uri.file(WXML_PATH);

  test("重复 line 注释可通过 Quick Fix 仅删除第二条注释", async () => {
    await openFixtureAndWaitForInitialDiagnostics(uri);

    const insertRepeatedLineComments = new WorkspaceEdit();
    insertRepeatedLineComments.insert(uri, new Position(2, 0), `${LINE_COMMENT}\n${LINE_COMMENT}\n`);
    const [diagnostic] = await applyEditAndWaitForDiagnostics(
      uri,
      insertRepeatedLineComments,
      (current) => current.length === 1,
    );

    const action = (await getQuickFixes(uri, diagnostic)).find((item) => item.title === DELETE_ACTION_TITLE);
    assert.ok(action, `未找到“${DELETE_ACTION_TITLE}” Quick Fix`);
    assert.strictEqual(action.kind?.value, "quickfix");

    assert.deepStrictEqual(
      await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === 0),
      [],
    );
    const fixedDocument = await workspace.openTextDocument(uri);
    assert.strictEqual(fixedDocument.lineAt(2).text, LINE_COMMENT);
    assert.strictEqual(fixedDocument.lineAt(3).text, "<view></view>");
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    const commentLines = document
      .getText()
      .split("\n")
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line === LINE_COMMENT)
      .map(({ index }) => index)
      .reverse();
    if (commentLines.length === 0) return;

    const restore = new WorkspaceEdit();
    for (const line of commentLines) {
      restore.delete(uri, document.lineAt(line).rangeIncludingLineBreak);
    }
    await applyEditAndWaitForDiagnostics(uri, restore, (current) => current.length === 0);
  });
});
