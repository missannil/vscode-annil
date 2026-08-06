import { assert, fs, path, vscode } from "#deps";
import type { SnippetDefinition, SnippetFileType } from "../../../_src/snippets/types.js";

const snippetFileTypes: readonly SnippetFileType[] = ["typescript", "json", "wxml", "wxss"];

export function getWorkspaceRoot(): string {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder === undefined) throw new Error("测试工作区未打开");

  return workspaceFolder.uri.fsPath;
}

export function getSnippetDirectory(): string {
  return path.join(getWorkspaceRoot(), "_test", ".vscode", "annil-snippets");
}

export function getTargetDirectory(name: string): vscode.Uri {
  return vscode.Uri.file(path.join(getWorkspaceRoot(), "_test", "miniprogram", "rightClickManager", name));
}

export function readSnippet(fileType: SnippetFileType): SnippetDefinition {
  const filePath = path.join(getSnippetDirectory(), `${fileType}.json`);

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as SnippetDefinition;
}

export function writeSnippet(fileType: SnippetFileType, snippets: SnippetDefinition): void {
  const filePath = path.join(getSnippetDirectory(), `${fileType}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(snippets, null, 2)}\n`, "utf8");
}

export function restoreInitialSnippets(): void {
  const snippetDirectory = getSnippetDirectory();
  fs.mkdirSync(snippetDirectory, { recursive: true });
  for (const fileType of snippetFileTypes) {
    const snippets = {
      customSnippet: {
        prefix: "customSnippet",
        body: [
          fileType === "typescript"
            ? "const customSnippet = true;"
            : fileType === "json"
            ? "{\\\"customSnippet\\\": true}"
            : fileType === "wxml"
            ? "<view data-custom-snippet=\\\"true\\\"></view>"
            : ".custom-snippet {}",
        ],
        description: "Annil test custom snippet",
      },
    } satisfies SnippetDefinition;
    writeSnippet(fileType, snippets);
  }
}

export async function removeDirectory(uri: vscode.Uri): Promise<void> {
  await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: false }).then(
    () => undefined,
    (error: unknown) => {
      if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") return;
      throw error;
    },
  );
}

export function createInputBox(
  values: readonly (string | undefined)[],
): (options?: vscode.InputBoxOptions) => Thenable<string | undefined> {
  let index = 0;

  return () => Promise.resolve(values[index++]);
}

export function assertGeneratedFile(uri: vscode.Uri, expectedText: string): void {
  assert.strictEqual(fs.readFileSync(uri.fsPath, "utf8"), expectedText);
}
