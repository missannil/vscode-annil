import { assert, fileURLToPath, fs, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { Range, Uri, window } from "vscode";
import { waitForDiagnostics } from "../diagnosticHelper.js";
import { registerCodeActionTests } from "./_codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");

const WXML_PATH = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/comment/commentTest.wxml",
);

describe("annil 注释规则", () => {
  let wxmlUri: Uri;
  let diagnostics: Diagnostic[];
  let originalWxml: string;

  async function restoreWxml(): Promise<void> {
    const editor = await window.showTextDocument(wxmlUri);
    const document = editor.document;

    await editor.edit((editBuilder) => {
      editBuilder.replace(
        new Range(0, 0, document.lineCount, 0),
        originalWxml,
      );
    });
    await document.save();
  }

  before(async () => {
    wxmlUri = Uri.file(WXML_PATH);
    // 以磁盘内容作为基准，避免复用上一次测试留下的脏 TextDocument。
    originalWxml = fs.readFileSync(WXML_PATH, "utf-8");
    await restoreWxml();
    diagnostics = [...await waitForDiagnostics(wxmlUri, (current) => current.length === 6)];
  });

  after(async () => {
    await restoreWxml();
  });

  test("产生 6 个诊断且消息和顺序正确", () => {
    const messages = diagnostics.map((d) => d.message);
    assert.deepStrictEqual(messages, [
      "无效的注释",
      "还没有开始注释不可结束",
      "重复的注释",
      "重复的注释",
      "重复的注释",
      "注释应写在文件头部",
    ]);
  });

  test("诊断位置正确", () => {
    assert.strictEqual(diagnostics[0].range.start.line, 15);
    assert.strictEqual(diagnostics[1].range.start.line, 18);
    assert.strictEqual(diagnostics[2].range.start.line, 22);
    assert.strictEqual(diagnostics[3].range.start.line, 27);
    assert.strictEqual(diagnostics[4].range.start.line, 33);
    assert.strictEqual(diagnostics[5].range.start.line, 36);
  });

  registerCodeActionTests(WXML_PATH);
});
