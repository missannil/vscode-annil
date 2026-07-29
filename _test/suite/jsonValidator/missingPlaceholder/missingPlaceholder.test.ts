import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyMissingPlaceholderQuickFix } from "./missingPlaceholder.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/missingPlaceholder/missingPlaceholder.json");
const COMPONENT_NAME = "validComponent";
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"validComponent\": \"/components/subExternal/subExternal\"",
  "  },",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：missingPlaceholder", () => {
  const uri = Uri.file(JSON_PATH);

  test("缺少 componentPlaceholder 时发布诊断并可通过 Quick Fix 插入默认值", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
    const diagnostic = diagnostics.find((item) => item.message === "缺少占位组件");
    assert.ok(diagnostic, "未找到缺少占位组件诊断");
    assertDiagnosticDetails(diagnostic, {
      message: "缺少占位组件",
      source: "vscode-annil",
      code: COMPONENT_NAME,
      range: [5, 3, 5, 23],
    });
    await applyMissingPlaceholderQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
