import { vscode } from "#deps";
import { resetSnippet } from "../snippets/index.js";
import { createAnnilComponent } from "./createAnnilComponent.js";

type SnippetTarget = {
  label: string;
  isPage: boolean;
};

export type RightClickUi = {
  activeTextEditor: vscode.TextEditor | undefined;
  showQuickPick<T extends vscode.QuickPickItem>(
    items: readonly T[],
    options?: vscode.QuickPickOptions,
  ): Thenable<T | undefined>;
  showWarningMessage(
    message: string,
    options?: vscode.MessageOptions,
    ...items: string[]
  ): Thenable<string | undefined>;
  showInformationMessage(message: string): Thenable<string | undefined>;
  showErrorMessage(message: string): Thenable<string | undefined>;
};

function getDefaultUi(): RightClickUi {
  return {
    get activeTextEditor(): vscode.TextEditor | undefined {
      return vscode.window.activeTextEditor;
    },
    showQuickPick: (items, options) => vscode.window.showQuickPick(items, options),
    showWarningMessage: (message, options, ...items) =>
      options === undefined
        ? vscode.window.showWarningMessage(message, ...items)
        : vscode.window.showWarningMessage(message, options, ...items),
    showInformationMessage: (message) => vscode.window.showInformationMessage(message),
    showErrorMessage: (message) => vscode.window.showErrorMessage(message),
  };
}

function getSnippetFileType(fileName: string, languageId: string): "wxml" | "wxss" | "json" | "typescript" | undefined {
  if (fileName.endsWith(".wxml")) return "wxml";
  if (fileName.endsWith(".wxss")) return "wxss";
  if (languageId === "json") return "json";
  if (languageId === "typescript" || languageId === "javascript") return "typescript";

  return undefined;
}

export async function insertDefaultSnippet(ui: RightClickUi = getDefaultUi()): Promise<void> {
  const editor = ui.activeTextEditor;
  if (editor === undefined) return;

  const target = await ui.showQuickPick<SnippetTarget>([
    { label: "组件（ancomp）", isPage: false },
    { label: "页面（anpage）", isPage: true },
  ], { placeHolder: "选择要恢复的 Annil 默认代码片段" });
  if (target === undefined) return;

  const fileType = getSnippetFileType(editor.document.fileName, editor.document.languageId);
  if (fileType === undefined) {
    return void ui.showWarningMessage("当前文件类型没有 Annil 默认代码片段");
  }

  try {
    const confirmed = await ui.showWarningMessage(
      `将恢复${target.isPage ? "页面" : "组件"}的默认代码片段，并覆盖用户当前设置，是否继续？`,
      { modal: true },
      "继续",
    );
    if (confirmed !== "继续") return;

    resetSnippet(fileType, target.isPage);
    void ui.showInformationMessage(
      `已重置 ${fileType}.json 中的 ${target.isPage ? "anpage" : "ancomp"} 代码片段。`
        + "如果关键字补全仍显示旧内容，请重新加载窗口。",
    );
  } catch (error) {
    console.error("恢复 Annil 默认代码片段失败:", error);
    void ui.showErrorMessage("恢复 Annil 默认代码片段失败，请检查用户片段文件格式");
  }
}

export function createComponentCommand(
  uri: vscode.Uri,
  inputBox: (options?: vscode.InputBoxOptions) => Thenable<string | undefined> = vscode.window.showInputBox,
): Promise<void> {
  return createAnnilComponent(uri, false, inputBox);
}

export function createPageCommand(
  uri: vscode.Uri,
  inputBox: (options?: vscode.InputBoxOptions) => Thenable<string | undefined> = vscode.window.showInputBox,
): Promise<void> {
  return createAnnilComponent(uri, true, inputBox);
}

export function rightClickManager(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("annil.createComponent", (uri: vscode.Uri) => createComponentCommand(uri)),
    vscode.commands.registerCommand("annil.createPage", (uri: vscode.Uri) => createPageCommand(uri)),
    vscode.commands.registerCommand("annil.insertDefaultSnippet", () => insertDefaultSnippet()),
  );
}
