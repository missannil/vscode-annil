import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { applyCodeActionAndWaitForDiagnostics, waitForQuickFix } from "../../wxmlValidator/codeActionHelper.js";
import { waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(
  projectRoot,
  "_test/suite/jsonValidator/missingPlaceholders/missingPlaceholders.json",
);
const ORIGINAL_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"firstComponent\": \"/components/subExternal/subExternal\",",
  "    \"secondComponent\": \"/components/subExternal/subExternal\"",
  "  },",
  "  \"componentPlaceholder\": {}",
  "}",
  "",
].join("\n");

const EXPECTED_JSON = [
  "{",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"firstComponent\": \"/components/subExternal/subExternal\",",
  "    \"secondComponent\": \"/components/subExternal/subExternal\"",
  "  },",
  "  \"componentPlaceholder\": {",
  "    \"firstComponent\": \"view\",",
  "    \"secondComponent\": \"view\"",
  "  }",
  "}",
  "",
].join("\n");

const uri = Uri.file(JSON_PATH);

function getComponentName(diagnostic: import("vscode").Diagnostic): string | undefined {
  return (diagnostic as import("vscode").Diagnostic & { info?: { componentName?: unknown } }).info?.componentName as
    | string
    | undefined;
}

async function applyMissingPlaceholderQuickFix(
  diagnostic: import("vscode").Diagnostic,
  remainingCount: number,
): Promise<void> {
  const componentName = getComponentName(diagnostic);
  if (componentName === undefined) return;
  const action = await waitForQuickFix(uri, diagnostic, `添加缺失占位组件 "${componentName}"`);
  assert.strictEqual(action.kind?.value, "quickfix");
  await applyCodeActionAndWaitForDiagnostics(uri, action, (current) => current.length === remainingCount);
}

describe("annil JSON 校验：missingPlaceholders（多个缺少占位组件）", () => {
  test("缺少多个占位组件时分别发布诊断，并可逐项修复", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);

    let diagnostics = await waitForDiagnostics(uri, (current) => current.length === 2);
    assert.deepStrictEqual(
      diagnostics.map((item) => item.code),
      ["annil.json.missingPlaceholder", "annil.json.missingPlaceholder"],
    );
    assert.deepStrictEqual(diagnostics.map(getComponentName).sort(), ["firstComponent", "secondComponent"]);

    const firstDiagnostic = diagnostics.find((item) => getComponentName(item) === "firstComponent");
    assert.ok(firstDiagnostic);
    await applyMissingPlaceholderQuickFix(firstDiagnostic, 1);

    diagnostics = await waitForDiagnostics(uri, (current) => current.length === 1);
    const secondDiagnostic = diagnostics.find((item) => getComponentName(item) === "secondComponent");
    assert.ok(secondDiagnostic);
    await applyMissingPlaceholderQuickFix(secondDiagnostic, 0);

    assert.strictEqual((await workspace.openTextDocument(uri)).getText(), EXPECTED_JSON);
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
