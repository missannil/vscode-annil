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
  "_test/suite/wxmlValidator/comment/all/all.wxml",
);
const ALL_COMMENT = "<!-- annil disable all -->";

describe("annil 注释：all", () => {
  let diagnostics: readonly Diagnostic[];
  const wxmlUri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length === 3);
  });

  test("未添加 all 注释时两个未知组件和重复 id 分别产生诊断", () => {
    assertDiagnosticDetails(diagnostics[0], {
      message: "重复的id",
      source: undefined,
      code: undefined,
      range: [4, 11, 4, 17],
    });
    assertDiagnosticDetails(diagnostics[1], {
      message: "未知标签",
      source: undefined,
      code: undefined,
      range: [7, 2, 7, 13],
    });
    assertDiagnosticDetails(diagnostics[2], {
      message: "未知标签",
      source: undefined,
      code: undefined,
      range: [9, 2, 9, 13],
    });
  });

  test("加入文件头 all 注释后仅保留重复 id 诊断", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(wxmlUri, new Position(0, 0), `${ALL_COMMENT}\n`);

    assertDiagnosticDetails(
      (await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 1))[0],
      {
        message: "重复的id",
        source: undefined,
        code: undefined,
        range: [5, 11, 5, 17],
      },
    );
  });

  // 测试会修改真实 fixture，结束后恢复源码，避免后续测试读取到 all 注释。
  after(async () => {
    const document = await workspace.openTextDocument(wxmlUri);
    if (!document.getText().startsWith(`${ALL_COMMENT}\n`)) return;

    const edit = new WorkspaceEdit();
    edit.delete(wxmlUri, new Range(new Position(0, 0), new Position(1, 0)));
    await applyEditAndWaitForDiagnostics(wxmlUri, edit, (current) => current.length === 3, true);
  });
});
