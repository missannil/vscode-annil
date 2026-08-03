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
  "_test/suite/wxmlValidator/comment/startEnd/startEnd.wxml",
);
const START_COMMENT = "<!-- annil disable start -->";
const END_COMMENT = "<!-- annil disable end -->";

describe("annil 注释：startEnd", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    initialDiagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 2);
  });

  test("插入 start/end 前，两个未知数据分别产生诊断", () => {
    assertDiagnosticDetails(initialDiagnostics[0], {
      message: "未知数据: \"disabledByStart\"",
      source: "vscode-annil",
      code: "annil.expression.unknownData",
      range: [2, 8, 2, 23],
    });
    assertDiagnosticDetails(initialDiagnostics[1], {
      message: "未知数据: \"enabledAfterEnd\"",
      source: "vscode-annil",
      code: "annil.expression.unknownData",
      range: [4, 8, 4, 23],
    });
  });

  test("插入 start/end 后仅保留 end 后的未知数据诊断", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(2, 0), `${START_COMMENT}\n`);
    edit.insert(wxmlUri, new Position(4, 0), `${END_COMMENT}\n`);

    const [diagnostic] = await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 1);

    assertDiagnosticDetails(diagnostic, {
      message: "未知数据: \"enabledAfterEnd\"",
      source: "vscode-annil",
      code: "annil.expression.unknownData",
      range: [6, 8, 6, 23],
    });
  });

  // 测试会插入 start/end 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (document.lineAt(2).text !== START_COMMENT || document.lineAt(5).text !== END_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(2, 0), new Position(3, 0)));
    edit.delete(wxmlUri, new Range(new Position(5, 0), new Position(6, 0)));
    await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 2, true);
  });
});
