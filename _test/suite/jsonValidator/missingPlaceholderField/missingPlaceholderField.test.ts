import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyMissingPlaceholderFieldQuickFix } from "./missingPlaceholderField.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(
  projectRoot,
  "_test/suite/jsonValidator/missingPlaceholderField/missingPlaceholderField.json",
);
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"validComponent\": \"/components/subExternal/subExternal\"",
  "  }",
  "}",
  "",
].join("\n");

describe("annil JSON 校验：missingPlaceholderField（componentPlaceholder 字段不存在）", () => {
  const uri = Uri.file(JSON_PATH);

  test("缺少 componentPlaceholder 字段时发布诊断并可通过 Quick Fix 创建该字段插入默认值", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
    const diagnostic = diagnostics.find((item) => item.message === "缺少占位组件");
    assert.ok(diagnostic, "未找到缺少占位组件诊断");
    assertDiagnosticDetails(diagnostic, {
      message: "缺少占位组件",
      source: "vscode-annil",
      code: "annil.json.missingPlaceholder",
      range: [0, 0, 0, 0],
    });
    await applyMissingPlaceholderFieldQuickFix(uri, diagnostic);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
