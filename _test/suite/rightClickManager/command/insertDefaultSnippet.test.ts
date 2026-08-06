import { assert, vscode } from "#deps";
import { describe, it as test } from "mocha";
import { insertDefaultSnippet, type RightClickUi } from "../../../../_src/rightClickManager/index.js";
import { defaultSnippets, snippetNames } from "../../../../_src/snippets/index.js";
import { getWorkspaceRoot, readSnippet, restoreInitialSnippets } from "../../snippets/snippetTestHelper.js";

function createUi(editor: vscode.TextEditor, target: "component" | "page"): RightClickUi {
  return {
    activeTextEditor: editor,
    showQuickPick: <T extends vscode.QuickPickItem>() =>
      Promise.resolve({
        label: target === "component" ? "组件（ancomp）" : "页面（anpage）",
        isPage: target === "page",
      } as unknown as T),
    showWarningMessage: (message, options, ...items) => Promise.resolve(items[0]),
    showInformationMessage: () => Promise.resolve(undefined),
    showErrorMessage: () => Promise.resolve(undefined),
  };
}

describe("命令：恢复 Annil 默认代码片段", () => {
  beforeEach(() => {
    restoreInitialSnippets();
  });

  afterEach(() => {
    restoreInitialSnippets();
  });

  test("通过命令恢复 TypeScript 组件片段并保留用户片段", async () => {
    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.file(`${getWorkspaceRoot()}/_test/miniprogram/app.ts`),
    );
    const editor = await vscode.window.showTextDocument(document);

    await insertDefaultSnippet(createUi(editor, "component"));

    const snippets = readSnippet("typescript");
    assert.deepStrictEqual(snippets[snippetNames.component], defaultSnippets.typescript[snippetNames.component]);
    assert.deepStrictEqual(snippets.customSnippet?.body, ["const customSnippet = true;"]);
  });

  test("通过命令恢复 TypeScript 页面片段", async () => {
    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.file(`${getWorkspaceRoot()}/_test/miniprogram/app.ts`),
    );
    const editor = await vscode.window.showTextDocument(document);

    await insertDefaultSnippet(createUi(editor, "page"));

    assert.deepStrictEqual(readSnippet("typescript")[snippetNames.page], defaultSnippets.typescript[snippetNames.page]);
  });
});
