import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import {
  applyEditAndWaitForDiagnostics,
  assertDiagnosticDetails,
  waitForDiagnosticUpdate,
} from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/repeatedRepeatTag/repeatedRepeatTag.wxml");
const REPEAT_TAG_COMMENT = "<!-- annil disable repeatTag -->";

describe("annil 注释：repeatedRepeatTag", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await diagnosticsReady;
  });

  test("插入重复 repeatTag 注释前不产生诊断", () => {
    assert.deepStrictEqual(initialDiagnostics, []);
  });

  test("插入第二个 repeatTag 注释后产生重复注释诊断", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(2, 0), `${REPEAT_TAG_COMMENT}\n${REPEAT_TAG_COMMENT}\n`);

    assertDiagnosticDetails((await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 1))[0], {
      message: "重复的注释",
      source: "vscode-annil",
      code: undefined,
      range: [3, 5, 3, 28],
    });
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(2).text !== REPEAT_TAG_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(2, 0), new Position(4, 0)));
    await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 0, true);
  });
});
