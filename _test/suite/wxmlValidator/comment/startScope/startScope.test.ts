import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { applyEditAndWaitForDiagnostics, assertDiagnosticDetails, waitForDiagnostics } from "../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const WXML_PATH = path.join(projectRoot, "_test/suite/wxmlValidator/comment/startScope/startScope.wxml");
const START_COMMENT = "<!-- annil disable start -->";

describe("annil 注释：startScope", () => {
  let initialDiagnostics: readonly Diagnostic[];
  const uri = Uri.file(WXML_PATH);

  before(async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    initialDiagnostics = await waitForDiagnostics(uri, (current) => current.length === 2);
  });

  test("插入 start 注释前，嵌套元素与外层同级元素分别产生诊断", () => {
    assertDiagnosticDetails(initialDiagnostics[0], {
      message: "未知数据: \"nestedData\"",
      source: undefined,
      code: undefined,
      range: [3, 7, 3, 21],
    });
    assertDiagnosticDetails(initialDiagnostics[1], {
      message: "未知数据: \"siblingData\"",
      source: undefined,
      code: undefined,
      range: [6, 6, 6, 21],
    });
  });

  test("嵌套 start 注释在离开当前节点列表后自动失效", async () => {
    const edit = new WorkspaceEdit();
    edit.insert(uri, new Position(3, 0), `${START_COMMENT}\n`);

    assertDiagnosticDetails((await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 1))[0], {
      message: "未知数据: \"siblingData\"",
      source: undefined,
      code: undefined,
      range: [7, 6, 7, 21],
    });
  });

  // 测试会插入 start 注释，结束后恢复 fixture，确保后续运行从原始场景开始。
  after(async () => {
    const document = await workspace.openTextDocument(uri);
    if (document.lineAt(3).text !== START_COMMENT) return;

    const edit = new WorkspaceEdit();
    edit.delete(uri, new Range(new Position(3, 0), new Position(4, 0)));
    await applyEditAndWaitForDiagnostics(uri, edit, (current) => current.length === 2, true);
  });
});
