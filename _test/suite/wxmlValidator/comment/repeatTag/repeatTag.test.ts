import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, assertDiagnosticDetails, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/repeatTag/repeatTag.wxml");
const REPEAT_TAG_COMMENT = "<!-- annil disable repeatTag -->";

describe("annil 注释：repeatTag", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
  });

  test("插入 repeatTag 注释前，第二个自定义组件标签产生重复诊断", () => {
    assertDiagnosticDetails(initialDiagnostics[0], {
      message: "重复的子组件",
      source: "vscode-annil",
      code: "annil.customComponent.repeatedTag",
      range: [4, 1, 4, 5],
    });
  });

  test("插入 repeatTag 注释后，紧随的重复自定义组件标签诊断消失", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(4, 0), `${REPEAT_TAG_COMMENT}\n`);

    assert.deepStrictEqual(
      await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 0),
      [],
    );
  });

  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(4).text !== REPEAT_TAG_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(4, 0), new Position(5, 0)));
    await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 1, true);
  });
});
