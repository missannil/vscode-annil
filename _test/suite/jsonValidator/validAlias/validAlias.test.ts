import { assert, fileURLToPath, path } from "#deps";
import { describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { waitForDiagnosticUpdate } from "../../wxmlValidator/diagnosticHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/validAlias/validAlias.json");

describe("annil JSON 校验：validAlias", () => {
  const uri = Uri.file(JSON_PATH);

  test("无 baseUrl 的 paths 别名导入与正确 JSON 配置不产生诊断", async () => {
    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);

    assert.deepStrictEqual(await diagnosticsReady, []);
  });
});
