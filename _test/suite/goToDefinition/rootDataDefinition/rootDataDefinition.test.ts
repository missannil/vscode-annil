import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { commands, Uri, window, workspace } from "vscode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const wxmlPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/rootDataDefinition/rootDataDefinition.wxml",
);
const tsPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/rootDataDefinition/rootDataDefinition.ts",
);

async function getDefinitionAt(searchText: string): Promise<vscode.Location[]> {
  const document = await workspace.openTextDocument(Uri.file(wxmlPath));
  await window.showTextDocument(document);
  const offset = document.getText().indexOf(searchText);
  assert.notStrictEqual(offset, -1, `未找到测试文本: ${searchText}`);

  return await commands.executeCommand<vscode.Location[]>(
    "vscode.executeDefinitionProvider",
    document.uri,
    document.positionAt(offset + Math.floor(searchText.length / 2)),
  );
}

describe("RootComponent 数据声明跳转", () => {
  test("WXML 数据跳转到 RootComponent 的 TS 声明", async () => {
    const definitions = await getDefinitionAt("propRequiredBool");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 1);
    assert.strictEqual(definitions[0].uri.fsPath, tsPath);
    assert.strictEqual(definitions[0].range.start.line, 3);
  });
});
