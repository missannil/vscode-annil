import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { languages, Uri, window, workspace } from "vscode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");

describe("unknownTag", () => {
  let diagnostics: Diagnostic[];

  before(async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/unknownTag/unknownTag.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);

    // 等待扩展的打开事件完成解析并发布诊断。
    await new Promise((resolve) => setTimeout(resolve, 500));
    diagnostics = languages.getDiagnostics(wxmlUri);
  });

  test("未注册的 unknownTag 标签产生未知标签诊断", () => {
    assert.deepStrictEqual(
      diagnostics.map((diagnostic) => diagnostic.message),
      ["未知标签"],
    );
    const range = diagnostics[0].range;
    assert.strictEqual(range.start.line, 8);
    assert.strictEqual(range.start.character, 2); // <unknownTag />标签前面的制表符/t 算一个字符,错误从u位置开始,所以 range.start.character = 2
    assert.strictEqual(range.end.line, 8);
    assert.strictEqual(range.end.character, 12); // <unknownTag />标签的长度为10,所以 range.end.character = 2 + 10 = 12
  });
});
