import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, assertDiagnosticDetails, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/invalidComment/invalidComment.wxml",
);
const INVALID_COMMENT = "<!-- annil disable invalid -->";

describe("annil 注释：invalidComment", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    initialDiagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 1);
  });

  test("插入无效注释前保留原有的未知标签诊断", () => {
    assertDiagnosticDetails(initialDiagnostics[0], {
      message: "未知标签",
      source: "vscode-annil",
      code: "annil.element.unknownTag",
      range: [2, 1, 2, 11],
    });
  });

  test("插入无效注释后保留原诊断并新增无效注释诊断", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(1, 0), `${INVALID_COMMENT}\n`);

    const diagnostics = await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 2);
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["无效的注释", "未知标签"],
    );
    // 验证器按完整的 annil 注释文本定位，而非仅定位无效的 "invalid" 后缀。
    assertDiagnosticDetails(diagnostics[0], {
      message: "无效的注释",
      source: "vscode-annil",
      code: "annil.comment.invalidText",
      range: [1, 5, 1, 26],
    });
    assertDiagnosticDetails(diagnostics[1], {
      message: "未知标签",
      source: "vscode-annil",
      code: "annil.element.unknownTag",
      range: [3, 1, 3, 11],
    });
  });

  // 测试会插入无效注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (document.lineAt(1).text !== INVALID_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(1, 0), new Position(2, 0)));
    await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 1, true);
  });
});
