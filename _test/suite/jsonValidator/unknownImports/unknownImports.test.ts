import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyUnknownImportQuickFix } from "./unknownImports.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/unknownImports/unknownImports.json");
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"unknownComponent\": \"/components/unknownComponent\"",
  "  },",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：unknownImports", () => {
  const uri = Uri.file(JSON_PATH);

  test("未知 usingComponents 导入时发布诊断并可通过 Quick Fix 删除", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const [diagnostic] = await waitForDiagnostics(uri, (current) => current.length === 1);
    assertDiagnosticDetails(diagnostic, {
      message: "未知的导入",
      source: "vscode-annil",
      code: "annil.json.unknownImport",
      range: [3, 5, 3, 21],
    });
    await applyUnknownImportQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
