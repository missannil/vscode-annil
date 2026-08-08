import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import { ConfigurationTarget, Uri, window, workspace } from "vscode";
import { waitForDiagnostics } from "../../../../diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../../../");

const wxmlPath = path.join(
  projectRoot,
  "_test/suite/wxmlValidator/element/customComponent/unknownAttr/allowedAttribute/allowedAttribute.wxml",
);

describe("allowUnknownAttributes", () => {
  test("允许属性名透传，但仍校验 key 中的 mustache 变量", async () => {
    const configuration = workspace.getConfiguration("annil");
    const previous = configuration.get<string[]>("allowUnknownAttributes");
    await configuration.update("allowUnknownAttributes", ["key"], ConfigurationTarget.Workspace);

    try {
      const wxmlUri = Uri.file(wxmlPath);
      const document = await workspace.openTextDocument(wxmlUri);
      await window.showTextDocument(document);
      const diagnostics = await waitForDiagnostics(wxmlUri, (current) => current.length > 0);

      const unknownAttribute = diagnostics.find((item) => item.code === "annil.customComponent.unknownAttribute");
      const unknownData = diagnostics.find((item) => item.code === "annil.expression.unknownData");
      assert.deepStrictEqual(
        diagnostics.map((item) => ({ code: item.code, message: item.message })),
        [{ code: "annil.expression.unknownData", message: "未知数据: \"unknownKey\"" }],
      );
      assert.strictEqual(unknownAttribute, undefined);
      assert.notStrictEqual(unknownData, undefined);
      assert.strictEqual(unknownData?.message, "未知数据: \"unknownKey\"");
      assert.strictEqual(unknownData?.source, "vscode-annil");
    } finally {
      await configuration.update("allowUnknownAttributes", previous, ConfigurationTarget.Workspace);
    }
  });
});
