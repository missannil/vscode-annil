import { assert, fileURLToPath, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { commands, Uri, window, workspace } from "vscode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../../");
const wxmlPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/annilDefinition/annilDefinition.wxml",
);
const tsPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/annilDefinition/annilDefinition.ts",
);
const externalComponentPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/annilDefinition/useExternal.ts",
);
const externalChunkPath = path.join(
  projectRoot,
  "_test/suite/goToDefinition/annilDefinition/defExternal.ts",
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

describe("Annil 声明跳转", () => {
  test("CustomComponent 标签跳转到其 TS 声明", async () => {
    const definitions = await getDefinitionAt("subInline");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 1);
    assert.strictEqual(definitions[0].uri.fsPath, tsPath);
    assert.strictEqual(definitions[0].range.start.line, 10);
  });

  test("ChunkComponent 的 id 值跳转到其 TS 声明", async () => {
    const definitions = await getDefinitionAt("itemChunk");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 1);
    assert.strictEqual(definitions[0].uri.fsPath, tsPath);
    assert.strictEqual(definitions[0].range.start.line, 14);
  });

  test("外部 CustomComponent 标签跳转到独立 TS 文件的声明", async () => {
    const definitions = await getDefinitionAt("externalComp");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 1);
    assert.strictEqual(definitions[0].uri.fsPath, externalComponentPath);
    assert.strictEqual(definitions[0].range.start.line, 9);
  });

  test("外部 ChunkComponent 的 id 值跳转到独立 TS 文件的声明", async () => {
    const definitions = await getDefinitionAt("externalChunk");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 1);
    assert.strictEqual(definitions[0].uri.fsPath, externalChunkPath);
    assert.strictEqual(definitions[0].range.start.line, 3);
  });

  test("ChunkComponent 标签名本身不触发跳转", async () => {
    const definitions = await getDefinitionAt("view");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 0);
  });

  test("普通 id 值不触发跳转", async () => {
    const definitions = await getDefinitionAt("otherId");
    assert.ok(Array.isArray(definitions));
    assert.strictEqual(definitions.length, 0);
  });
});
