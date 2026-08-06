import { assert, fs, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { createAnnilComponent } from "../../../../_src/rightClickManager/createAnnilComponent.js";
import { snippetNames } from "../../../../_src/snippets/index.js";
import type { SnippetDefinition } from "../../../../_src/snippets/types.js";
import {
  createInputBox,
  getSnippetDirectory,
  getTargetDirectory,
  removeDirectory,
  restoreInitialSnippets,
  writeSnippet,
} from "../../snippets/snippetTestHelper.js";

const componentName = "test-card";

function writeComponentSnippets(): void {
  const snippets: Record<string, SnippetDefinition> = {
    typescript: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["const generatedName = \"$1\";"],
        description: "component test snippet",
      },
    },
    json: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["{\"generated\": \"component\"}"],
        description: "component test snippet",
      },
    },
    wxml: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: ["<view data-generated=\"component\"></view>"],
        description: "component test snippet",
      },
    },
    wxss: {
      [snippetNames.component]: {
        prefix: snippetNames.component,
        body: [".generated-component {}"],
        description: "component test snippet",
      },
    },
  };

  for (
    const [fileType, definition] of Object.entries(snippets) as [
      "typescript" | "json" | "wxml" | "wxss",
      SnippetDefinition,
    ][]
  ) {
    writeSnippet(fileType, definition);
  }
}

describe("右键新建组件", () => {
  const targetDirectory = getTargetDirectory("componentTarget");
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

  test("根据用户组件片段生成四类文件并替换组件名称", async () => {
    writeComponentSnippets();

    await createAnnilComponent(targetDirectory, false, createInputBox([componentName]));

    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.ts`), "utf8"),
      `const generatedName = "${componentName}";`,
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.json`), "utf8"),
      "{\"generated\": \"component\"}",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.wxml`), "utf8"),
      "<view data-generated=\"component\"></view>",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(componentDirectory.fsPath, `${componentName}.wxss`), "utf8"),
      ".generated-component {}",
    );
    assert.strictEqual(fs.existsSync(getSnippetDirectory()), true);
  });

  test("取消组件名称时不创建组件目录", async () => {
    await createAnnilComponent(targetDirectory, false, createInputBox([undefined]));

    assert.strictEqual(fs.existsSync(componentDirectory.fsPath), false);
  });
});
