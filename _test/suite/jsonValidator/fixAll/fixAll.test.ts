import { assert, fileURLToPath, path } from "#deps";
import { after, describe, it as test } from "mocha";
import { Uri, window, workspace } from "vscode";
import { assertDiagnosticDetails, waitForDiagnostics } from "../../wxmlValidator/diagnosticHelper.js";
import { restoreJsonFixture } from "../jsonFixtureHelper.js";
import { applyJsonFixAll } from "./fixAll.codeAction.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const JSON_PATH = path.join(projectRoot, "_test/suite/jsonValidator/fixAll/fixAll.json");
const ORIGINAL_JSON = [
  "{",
  "  \"unknownConfig\": true,",
  "  \"component\": true,",
  "  \"usingComponents\": {",
  "    \"pathComponent\": \"/wrong/path\",",
  "    \"unknownComponent\": \"/components/unknownComponent\"",
  "  },",
  "  \"componentPlaceholder\": {",
  "    \"pathComponent\": \"view\",",
  "    \"unknownPlaceholder\": \"view\"",
  "  }",
  "}",
  "",
].join("\n");

describe("annil JSON 集成：fixAll", () => {
  const uri = Uri.file(JSON_PATH);

  test("fix-all 按诊断快照分两次修复当前组件 JSON", async () => {
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);
    const diagnostics = await waitForDiagnostics(uri, (current) => current.length === 5);
    assertDiagnosticDetails(diagnostics[0], {
      message: "未知配置属性",
      source: "vscode-annil",
      code: "unknownConfig",
      range: [1, 3, 1, 16],
    });
    assertDiagnosticDetails(diagnostics[1], {
      message: " 缺少导入的组件",
      source: "vscode-annil",
      code: "missingComponent",
      range: [3, 3, 3, 18],
    });
    assertDiagnosticDetails(diagnostics[2], {
      message: "未知的导入",
      source: "vscode-annil",
      code: "unknownComponent",
      range: [5, 5, 5, 21],
    });
    assertDiagnosticDetails(diagnostics[3], {
      message: "无效的路径",
      source: "vscode-annil",
      code: "/wrong/path",
      range: [4, 22, 4, 33],
    });
    assertDiagnosticDetails(diagnostics[4], {
      message: "未知的占位组件",
      source: "vscode-annil",
      code: "unknownPlaceholder",
      range: [9, 5, 9, 23],
    });

    const firstPassDiagnostics = await applyJsonFixAll(
      uri,
      (current) => current.length === 1 && current[0]?.message === "缺少占位组件",
    );
    assertDiagnosticDetails(firstPassDiagnostics[0], {
      message: "缺少占位组件",
      source: "vscode-annil",
      code: "missingComponent",
      range: [6, 3, 6, 23],
    });

    assert.deepStrictEqual(
      await applyJsonFixAll(uri, (current) => current.length === 0),
      [],
    );
    assert.deepStrictEqual(JSON.parse((await workspace.openTextDocument(uri)).getText()), {
      component: true,
      usingComponents: {
        missingComponent: "/components/subInline/index",
        pathComponent: "/components/subExternal/subExternal",
      },
      componentPlaceholder: {
        missingComponent: "view",
        pathComponent: "view",
      },
    });
  });

  after(async () => {
    await restoreJsonFixture(uri, ORIGINAL_JSON);
  });
});
