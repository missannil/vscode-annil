import { fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyMissingImportQuickFix } from "./missingImports.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/missingImports/missingImports.json");
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {},",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：missingImports", () => {
  const uri = Uri.file(JSON_PATH);

  test("TS 已引用但 usingComponents 缺少导入时发布诊断并可通过 Quick Fix 补齐", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const [diagnostic] = await waitForDiagnostics(uri, (current) => current.length === 1);

    assertDiagnosticDetails(diagnostic, {
      message: " 缺少导入的组件",
      source: "vscode-annil",
      code: "annil.json.missingImport",
      range: [2, 3, 2, 18],
    });
    await applyMissingImportQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
