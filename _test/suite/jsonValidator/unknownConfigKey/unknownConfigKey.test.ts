import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyUnknownConfigKeyQuickFix } from "./unknownConfigKey.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/unknownConfigKey/unknownConfigKey.json");
const ORIGINAL_JSON = [
  "{",
  "  \"unknownConfig\": true,",
  "  \"component\": true,",
  "  \"usingComponents\": {},",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：unknownConfigKey", () => {
  const uri = Uri.file(JSON_PATH);

  test("未知 JSON 顶层配置键时发布诊断并可通过 Quick Fix 删除", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const [diagnostic] = await waitForDiagnostics(uri, (current) => current.length === 1);
    assertDiagnosticDetails(diagnostic, {
      message: "未知配置属性",
      source: "vscode-annil",
      code: "annil.json.unknownConfigKey",
      range: [1, 3, 1, 16],
    });
    await applyUnknownConfigKeyQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
