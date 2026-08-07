import { assert, fileURLToPath, fs, path, vscode } from "#deps";
import { describe, it as test } from "mocha";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "../../../..");
const wxmlPath = path.join(projectRoot, "_test/suite/miniTest/fixtures/miniCard/miniCard.wxml");
const generatedPath = path.join(projectRoot, "miniTest/components/miniCard.py");
const expectedPath = path.join(projectRoot, "_test/suite/miniTest/fixtures/miniCard/expected.txt");

async function removeGeneratedFile(): Promise<void> {
  await vscode.workspace.fs.delete(vscode.Uri.file(generatedPath), { useTrash: false }).then(
    () => undefined,
    (error: unknown) => {
      if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") return;
      throw error;
    },
  );
}

describe("miniTest 命令", () => {
  beforeEach(removeGeneratedFile);
  afterEach(removeGeneratedFile);

  test("通过真实 WXML 组件触发命令并生成预期 Python 包装类", async () => {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(wxmlPath));
    await vscode.window.showTextDocument(document);

    await vscode.commands.executeCommand("annil.generateMiniTestClass");

    assert.strictEqual(fs.existsSync(generatedPath), true);
    const generated = fs.readFileSync(generatedPath, "utf8");
    const expected = fs.readFileSync(expectedPath, "utf8");
    assert.strictEqual(generated, expected);
  });
});
