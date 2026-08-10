import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForStableDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

describe("componentFieldSameName", () => {
  test("组件名与字段重名时，subGoods 报未知属性，_subGoods 合法且不报缺少", async () => {
    const wxmlUri = Uri.file(
      path.join(
        projectRoot,
        "_test/suite/wxmlValidator/element/customComponent/unknownAttr/componentFieldSameName/componentFieldSameName.wxml",
      ),
    );
    const document = await workspace.openTextDocument(wxmlUri);
    await window.showTextDocument(document);
    const diags = await waitForStableDiagnostics(wxmlUri, 1);

    // 应有未知属性、属性值不匹配，以及绑定值中的未知数据诊断。
    const unknown = diags.filter((d) => d.message.startsWith("未知属性:"));
    const missing = diags.filter((d) => d.message.startsWith("缺少属性:"));
    const mismatch = diags.filter((d) => d.message.startsWith("属性 ") && d.message.includes("应绑定"));
    const invalidVariable = diags.filter((d) => d.message === `无效的变量: "自定义"`);
    assert.strictEqual(unknown.length, 1);
    assert.strictEqual(unknown[0].message, `未知属性: "subInline"`);
    assert.strictEqual(unknown[0].code, "annil.customComponent.unknownAttribute");
    assert.strictEqual(missing.length, 0);
    // Root 契约要求精确绑定 {{subGoods}}，绑定 {{自定义}} 必须报错
    assert.strictEqual(mismatch.length, 1);
    assert.strictEqual(mismatch[0].message, `属性 "_subInline" 应绑定 "{{subGoods}}"`);
    assert.strictEqual(mismatch[0].code, "annil.customComponent.attributeValueMismatch");
    assert.strictEqual(invalidVariable.length, 1);
    assert.strictEqual(invalidVariable[0].code, "annil.expression.invalidVariable");

    const unknownLine = document.getText().split("\n").findIndex((line) => line.includes("subInline=\""));
    const unknownStart = document.lineAt(unknownLine).text.indexOf("subInline");
    assert.strictEqual(unknown[0].range.start.line, unknownLine);
    assert.strictEqual(unknown[0].range.start.character, unknownStart);
    assert.strictEqual(unknown[0].range.end.character, unknownStart + "subInline".length);

    const mismatchLine = document.getText().split("\n").findIndex((line) => line.includes("自定义"));
    const mismatchStart = document.lineAt(mismatchLine).text.indexOf("自定义");
    assert.strictEqual(mismatch[0].range.start.line, mismatchLine);
    assert.strictEqual(mismatch[0].range.start.character, mismatchStart);
    assert.strictEqual(mismatch[0].range.end.character, mismatchStart + "自定义".length);
    assert.strictEqual(invalidVariable[0].range.start.line, mismatchLine);
    assert.strictEqual(invalidVariable[0].range.start.character, mismatchStart);
    assert.strictEqual(invalidVariable[0].range.end.character, mismatchStart + "自定义".length);
  });
});
