/**
 * 未知数据测试
 *
 * 打开 unknownData 组件 wxml → linter 触发 → 校验数据引用
 */
import { assert, fileURLToPath, path } from "#deps";
import { describe as suite, it as test } from "mocha";
import type { Diagnostic } from "vscode";
import { languages, Uri, window, workspace } from "vscode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite("unknownData", () => {
  let annilDiags: Diagnostic[];

  before(async () => {
    // 编译后在 out/_test/suite/wxmlValidator/unknownData/，需回到项目根再进入 _test/
    const wxmlPath = path.resolve(
      __dirname,
      "../../../../..",
      "_test/suite/wxmlValidator/unknownData/unknownData.wxml",
    );
    const wxmlUri = Uri.file(wxmlPath);
    const doc = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(doc);

    // 等待 linter 异步回调 + 200ms debounce
    await new Promise((r) => setTimeout(r, 800));

    // 只取未知数据的诊断
    const raw = languages.getDiagnostics(wxmlUri);
    annilDiags = (raw as Diagnostic[]).filter((d) => d.message.includes("未知数据"));
  });

  test("{{unknownData}} 应产生诊断", () => {
    const expectedDiag = annilDiags.filter((d) => d.message === "未知数据: \"unknownData\"");

    assert.strictEqual(expectedDiag.length, 1);
    assert.strictEqual(expectedDiag[0].message, "未知数据: \"unknownData\"");
    assert.strictEqual(expectedDiag[0].range.start.line, 6);
  });

  test("_ 前缀内部数据应产生诊断", () => {
    const expectedDiag = annilDiags.filter((d) => d.message === "未知数据: \"_innerData\"");

    assert.strictEqual(expectedDiag.length, 1);
    assert.strictEqual(expectedDiag[0].message, "未知数据: \"_innerData\"");
    assert.strictEqual(expectedDiag[0].range.start.line, 4);
  });

  test("chunkA 中的 knownData 应产生诊断", () => {
    const knownDiag = annilDiags.filter((d) => d.message === "未知数据: \"knownData\"");

    assert.strictEqual(knownDiag.length, 1);
    assert.strictEqual(knownDiag[0].range.start.line, 11);
  });

  test("_subExternal_innerStr 应产生诊断", () => {
    const expectedDiag = annilDiags.filter((d) => d.message === "未知数据: \"_subExternal_innerStr\"");

    assert.strictEqual(expectedDiag.length, 1);
    assert.strictEqual(expectedDiag[0].range.start.line, 17);
  });
});
