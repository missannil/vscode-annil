import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import { languages, Uri, window, workspace } from "vscode";
import { waitForDiagnosticUpdate } from "../../wxmlValidator/diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/externalImports/externalImports.json");
const WXML_PATH = path.join(projectRoot, "_test/suite/jsonValidator/externalImports/externalImports.wxml");

describe("annil JSON 校验：外部定义子组件", () => {
  const uri = Uri.file(JSON_PATH);

  test("值导入的外部子组件声明在 usingComponents 中不产生诊断", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);

    assert.deepStrictEqual(await diagnosticsReady, []);
    assert.deepStrictEqual(languages.getDiagnostics(Uri.file(WXML_PATH)), []);
  });
});
