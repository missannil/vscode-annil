import { assert, fs, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { createComponentCommand } from "../../../../_src/rightClickManager/index.js";
import { snippetNames } from "../../../../_src/snippets/index.js";
import type { SnippetDefinition } from "../../../../_src/snippets/types.js";
import {
  createInputBox,
  getTargetDirectory,
  removeDirectory,
  restoreInitialSnippets,
  writeSnippet,
} from "../../snippets/snippetTestHelper.js";

const componentName = "command-card";

function writeCommandSnippets(): void {
  const snippets: Record<string, SnippetDefinition> = {
    typescript: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["const commandComponent = \"$1\";"],
        description: "command component snippet",
      },
    },
    json: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["{\"command\": \"component\"}"],
        description: "command component snippet",
      },
    },
    wxml: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["<view data-command=\"component\"></view>"],
        description: "command component snippet",
      },
    },
    wxss: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: [".command-component {}"],
        description: "command component snippet",
      },
    },
  };

  for (
    const [fileType, snippet] of Object.entries(snippets) as [
      "typescript" | "json" | "wxml" | "wxss",
      SnippetDefinition,
    ][]
  ) {
    writeSnippet(fileType, snippet);
  }
}

describe("命令：新建组件", () => {
  const targetDirectory = getTargetDirectory("commandComponentTarget");
  const componentDirectory = vscode.Uri.joinPath(targetDirectory, componentName);

  beforeEach(async () => {
    restoreInitialSnippets();
    await removeDirectory(componentDirectory);
    await vscode.workspace.fs.createDirectory(targetDirectory);
  });

  afterEach(async () => {
    restoreInitialSnippets();
    await removeDirectory(componentDirectory);
  });

  test("通过命令生成组件代码片段内容", async () => {
    writeCommandSnippets();

    await createComponentCommand(targetDirectory, createInputBox([componentName]));

    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.ts`), "utf8"),
      `const commandComponent = "${componentName}";`,
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.json`), "utf8"),
      "{\"command\": \"component\"}",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.wxml`), "utf8"),
      "<view data-command=\"component\"></view>",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.wxss`), "utf8"),
      ".command-component {}",
    );
  });
});
