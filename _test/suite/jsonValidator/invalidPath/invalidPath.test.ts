import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyInvalidPathQuickFix } from "./invalidPath.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/invalidPath/invalidPath.json");
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"validComponent\": \"/wrong/path\"",
  "  },",
  "  \"componentPlaceholder\": {",
  "    \"validComponent\": \"view\"",
  "  }",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：invalidPath", () => {
  const uri = Uri.file(JSON_PATH);

  test("usingComponents 路径不一致时发布诊断并可通过 Quick Fix 修正", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const [diagnostic] = await waitForDiagnostics(uri, (current) => current.length === 1);

    assertDiagnosticDetails(diagnostic, {
      message: "无效的路径",
      source: "vscode-annil",
      code: "annil.json.invalidPath",
      range: [3, 23, 3, 34],
    });
    assert.strictEqual(
      (diagnostic as unknown as { info: { correctPath: string } }).info.correctPath,
      "/components/subExternal/subExternal",
    );
    await applyInvalidPathQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
