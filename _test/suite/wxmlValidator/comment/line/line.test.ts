import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, assertDiagnosticDetails, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/line/line.wxml",
);
const LINE_COMMENT = "<!-- annil disable line -->";

describe("annil 注释：line", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    initialDiagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
  });

  test("插入 line 注释前，两个元素分别产生未知数据诊断", () => {
    assertDiagnosticDetails(initialDiagnostics[0], {
      message: "未知数据: \"xxx\"",
      source: "vscode-annil",
      code: "annil.expression.unknownData",
      range: [2, 8, 2, 11],
    });
    assertDiagnosticDetails(initialDiagnostics[1], {
      message: "未知数据: \"yyy\"",
      source: "vscode-annil",
      code: "annil.expression.unknownData",
      range: [4, 8, 4, 11],
    });
  });

  test("插入 line 注释后，仅紧随元素的未知数据诊断消失", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(2, 0), `${LINE_COMMENT}\n`);

    assertDiagnosticDetails(
      (await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 1))[0],
      {
        message: "未知数据: \"yyy\"",
        source: "vscode-annil",
        code: "annil.expression.unknownData",
        range: [5, 8, 5, 11],
      },
    );
  });

  // 测试会插入 line 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (document.lineAt(2).text !== LINE_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(2, 0), new Position(3, 0)));
    await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 2, true);
  });
});
