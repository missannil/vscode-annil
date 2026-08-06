import { assert, fs, path, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { createAnnilComponent } from "../../../../_src/rightClickManager/createAnnilComponent.js";
import { snippetNames } from "../../../../_src/snippets/index.js";
import type { SnippetDefinition } from "../../../../_src/snippets/types.js";
import {
  createInputBox,
  getTargetDirectory,
  removeDirectory,
  restoreInitialSnippets,
  writeSnippet,
} from "../../snippets/snippetTestHelper.js";

const pageName = "profile";
const pagePath = "pages/user/profile";

function writePageSnippets(): void {
  const snippets: Record<string, SnippetDefinition> = {
    typescript: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["const generatedName = \"$1\";", "const generatedPath = \"/$2\";"],
        description: "page test snippet",
      },
    },
    json: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["{\"generated\": \"page\"}"],
        description: "page test snippet",
      },
    },
    wxml: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: ["<view data-generated=\"page\"></view>"],
        description: "page test snippet",
      },
    },
    wxss: {
      [snippetNames.page]: {
        prefix: snippetNames.page,
        body: [".generated-page {}"],
        description: "page test snippet",
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

describe("右键新建页面", () => {
  const targetDirectory = getTargetDirectory("pageTarget");
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

  test("根据用户页面片段生成四类文件并替换名称和页面路径", async () => {
    writePageSnippets();

    await createAnnilComponent(targetDirectory, true, createInputBox([pageName, pagePath]));

    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.ts`), "utf8"),
      `const generatedName = "${pageName}";\nconst generatedPath = "/${pagePath}";`,
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.json`), "utf8"),
      "{\"generated\": \"page\"}",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.wxml`), "utf8"),
      "<view data-generated=\"page\"></view>",
    );
    assert.strictEqual(
      fs.readFileSync(path.join(pageDirectory.fsPath, `${pageName}.wxss`), "utf8"),
      ".generated-page {}",
    );
  });

  test("取消页面路径时不创建页面目录", async () => {
    await createAnnilComponent(targetDirectory, true, createInputBox([pageName, undefined]));

    assert.strictEqual(fs.existsSync(pageDirectory.fsPath), false);
  });
});
