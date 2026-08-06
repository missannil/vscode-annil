import { assert, fs, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { createPageCommand } from "../../../../_src/rightClickManager/index.js";
import { snippetNames } from "../../../../_src/snippets/index.js";
import type { SnippetDefinition } from "../../../../_src/snippets/types.js";
import {
  createInputBox,
  getTargetDirectory,
  removeDirectory,
  restoreInitialSnippets,
  writeSnippet,
} from "../../snippets/snippetTestHelper.js";

const pageName = "command-profile";
const pagePath = "pages/command/profile";

function writeCommandSnippets(): void {
  const snippets: Record<string, SnippetDefinition> = {
    typescript: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["const commandPage = \"$1\";", "const commandPath = \"/$2\";"],
        description: "command page snippet",
      },
    },
    json: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["{\"command\": \"page\"}"],
        description: "command page snippet",
      },
    },
    wxml: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["<view data-command=\"page\"></view>"],
        description: "command page snippet",
      },
    },
    wxss: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: [".command-page {}"],
        description: "command page snippet",
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

describe("命令：新建页面", () => {
  const targetDirectory = getTargetDirectory("commandPageTarget");
  const pageDirectory = vscode.Uri.joinPath(targetDirectory, pageName);

  beforeEach(async () => {
    restoreInitialSnippets();
    await removeDirectory(pageDirectory);
    await vscode.workspace.fs.createDirectory(targetDirectory);
  });

  afterEach(async () => {
    restoreInitialSnippets();
    await removeDirectory(pageDirectory);
  });

  test("通过命令生成页面代码片段内容", async () => {
    writeCommandSnippets();

    await createPageCommand(targetDirectory, createInputBox([pageName, pagePath]));

    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.ts`), "utf8"),
      `const commandPage = "${pageName}";\nconst commandPath = "/${pagePath}";`,
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.json`), "utf8"),
      "{\"command\": \"page\"}",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.wxml`), "utf8"),
      "<view data-command=\"page\"></view>",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.wxss`), "utf8"),
      ".command-page {}",
    );
  });
});
