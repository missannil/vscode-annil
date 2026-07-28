import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { waitForDiagnosticUpdate } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/repeated/repeated.wxml");
const REPEATED_COMMENTS = [
  "<!-- annil disable line -->",
  "<!-- annil disable line -->",
  "<view></view>",
  "<!-- annil disable start -->",
  "<!-- annil disable start -->",
  "<!-- annil disable end -->",
  "<view></view>",
  "<!-- annil disable repeatTag -->",
  "<!-- annil disable repeatTag -->",
  "",
].join("\n");
const INSERTED_LINE_COUNT = REPEATED_COMMENTS.split("\n").length - 1;

describe("annil 注释：repeated", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await diagnosticsReady;
  });

  test("插入重复注释前不产生诊断", () => {
    assert.deepStrictEqual(initialDiagnostics, []);
  });

  test("插入重复的 line、start、repeatTag 注释后分别产生诊断", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 3);
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(2, 0), REPEATED_COMMENTS);
    assert.strictEqual(await workspace.applyEdit(edit), true);

    assert.deepStrictEqual((await diagnosticsReady).map((diagnostic) => diagnostic.message), [
      "重复的注释",
      "重复的注释",
      "重复的注释",
    ]);
  });

  // 测试会插入重复注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(2).text !== "<!-- annil disable line -->") return;

    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(2, 0), new Position(2 + INSERTED_LINE_COUNT, 0)));
    assert.strictEqual(await workspace.applyEdit(edit), true);
    assert.strictEqual(await document.save(), true);
    await diagnosticsReady;
  });
});
