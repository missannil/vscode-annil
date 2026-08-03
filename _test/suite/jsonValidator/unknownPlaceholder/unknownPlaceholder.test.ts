import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyUnknownPlaceholderQuickFix } from "./unknownPlaceholder.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/unknownPlaceholder/unknownPlaceholder.json");
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {},",
  "  \"componentPlaceholder\": {",
  "    \"unknownPlaceholder\": \"view\"",
  "  }",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：unknownPlaceholder", () => {
  const uri = Uri.file(JSON_PATH);

  test("未知 componentPlaceholder 键时发布诊断并可通过 Quick Fix 删除", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const [diagnostic] = await waitForDiagnostics(uri, (current) => current.length === 1);
    assertDiagnosticDetails(diagnostic, {
      message: "未知的占位组件",
      source: "vscode-annil",
      code: "annil.json.unknownPlaceholder",
      range: [4, 5, 4, 23],
    });
    await applyUnknownPlaceholderQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
