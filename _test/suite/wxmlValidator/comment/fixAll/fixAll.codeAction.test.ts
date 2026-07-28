import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { commands, Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, waitForDiagnostics, waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/fixAll/fixAll.wxml");
const ORIGINAL_WXML = [
  "<!-- 测试目标：fix-all 应一次删除全部可修复的 Annil 注释诊断。 -->",
  "<!-- 第一个元素使后续 all 注释不再位于文件头部。 -->",
  "<view></view>",
  "<!-- annil disable all -->",
  "<!-- annil disable end -->",
  "",
].join("\n");

describe("annil Code Action：fixAll", () => {
  const uri = Uri.file(WXML_PATH);

  test("fix-all 一次删除全部可修复的注释诊断", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    await waitForDiagnostics(uri, (current) => current.length === 2);

    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    await commands.executeCommand("annil.fix-all");

    assert.deepStrictEqual(await diagnosticsReady, []);
    const fixedText = (await workspace.openTextDocument(uri)).getText();
    assert.strictEqual(fixedText.includes("<!-- annil disable all -->"), false);
    assert.strictEqual(fixedText.includes("<!-- annil disable end -->"), false);
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.getText() === ORIGINAL_WXML) return;

    const restore = new WorkspaceEdit();
    restore.replace(
      uri,
      new Range(new Position(0, 0), document.positionAt(document.getText().length)),
      ORIGINAL_WXML,
    );
    await applyEditAndWaitForDiagnostics(uri, restore, (current) => current.length === 2, true);
  });
});
