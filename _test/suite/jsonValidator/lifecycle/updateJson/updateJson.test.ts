import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Position, Range, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { waitForDiagnostics, waitForDiagnosticUpdate } from "../../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../../jsonFixtureHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/lifecycle/updateJson/updateJson.json");
const uri = Uri.file(JSON_PATH);
const ORIGINAL_JSON = [
  "{",
  "  \"unknownConfig\": true,",
  "  \"component\": true,",
  "  \"usingComponents\": {},",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

describe("annil JSON 生命周期：update", () => {
  test("JSON 修改后重新发布当前文件诊断", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const initialDiagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
    assert.strictEqual(initialDiagnostics[0].code, "annil.json.unknownConfigKey");

    const diagnosticsReady = waitForDiagnosticUpdate(uri, (current) => current.length === 0);
    const edit = new WorkspaceEdit();
    edit.replace(
      uri,
      new Range(new Position(0, 0), document.positionAt(document.getText().length)),
      ORIGINAL_JSON.replace("  \"unknownConfig\": true,\n", ""),
    );
    assert.strictEqual(await workspace.applyEdit(edit), true);
    assert.strictEqual(await document.save(), true);
    assert.deepStrictEqual(await diagnosticsReady, []);
  });

  after(async () => {
    await workspace.fs.writeFile(uri, new TextEncoder().encode(ORIGINAL_JSON));
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
