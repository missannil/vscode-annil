import { vscode } from "#deps";
import { GithubStarAuthorization } from "../authorization/githubStar.js";
import { getSiblingUri, isComponentUri, isJsonFile } from "../utils/uriHelper.js";
import { formatDocument } from "./formatFixedDocument.js";

export type CodeActionResolver = (
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
) => vscode.CodeAction[];

/** 注册组件级 annil.fix-all 命令。 */
export function registerFixAllCommand(
  context: vscode.ExtensionContext,
  resolveCodeActions: CodeActionResolver,
  authorization: GithubStarAuthorization,
): void {
  context.subscriptions.push(
    // eslint-disable-next-line complexity
    vscode.commands.registerCommand("annil.fix-all", async () => {
      if (!await authorization.ensureFixAllAccess()) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("annil: 没有打开的编辑器");

        return;
      }

      const activeUri = editor.document.uri;
      if (!isComponentUri(activeUri)) {
        vscode.window.showInformationMessage("annil: 当前文件不属于完整的小程序组件");

        return;
      }

      const componentUris = [
        getSiblingUri(activeUri, ".ts"),
        getSiblingUri(activeUri, ".wxml"),
        getSiblingUri(activeUri, ".json"),
      ];
      const fixActions: Array<{
        diagnostic: vscode.Diagnostic;
        document: vscode.TextDocument;
        lastOffset: number;
      }> = [];

      for (const uri of componentUris) {
        const document = await vscode.workspace.openTextDocument(uri);
        const diagnostics = vscode.languages.getDiagnostics(uri);
        for (const diagnostic of diagnostics) {
          if (diagnostic.source !== "vscode-annil") continue;
          const action = getFirstCodeAction(resolveCodeActions, document, diagnostic);
          if (action !== undefined) {
            fixActions.push({ diagnostic, document, lastOffset: getActionLastOffset(document, action) });
          }
        }
      }

      if (fixActions.length === 0) {
        vscode.window.showInformationMessage("annil: 当前组件没有可修复的诊断");

        return;
      }

      fixActions.sort((left, right) => right.lastOffset - left.lastOffset);
      for (const { diagnostic, document } of fixActions) {
        const action = getFirstCodeAction(resolveCodeActions, document, diagnostic);
        if (action?.edit) await vscode.workspace.applyEdit(action.edit);
      }
      for (const uri of componentUris) {
        if (!isJsonFile(uri)) continue;
        const document = await vscode.workspace.openTextDocument(uri);
        const cleanupEdit = cleanupJsonTrailingCommas(document);
        if (cleanupEdit.size > 0) await vscode.workspace.applyEdit(cleanupEdit);
      }
      const formattedUris = new Set(fixActions.map(({ document }) => document.uri.toString()));
      for (const uri of componentUris) {
        if (!formattedUris.has(uri.toString())) continue;
        const document = await vscode.workspace.openTextDocument(uri);
        await formatDocument(document);
      }
      vscode.window.showInformationMessage("annil: 已修复全部");
    }),
  );
}

function getFirstCodeAction(
  resolveCodeActions: CodeActionResolver,
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const action = resolveCodeActions(document, diagnostic)[0];

  return action?.edit ? action : undefined;
}

function getActionLastOffset(document: vscode.TextDocument, action: vscode.CodeAction): number {
  let lastOffset = -1;

  for (const [uri, edits] of action.edit?.entries() ?? []) {
    if (uri.toString() !== document.uri.toString()) continue;
    for (const edit of edits) {
      lastOffset = Math.max(lastOffset, document.offsetAt(edit.range.end));
    }
  }

  return lastOffset;
}

function cleanupJsonTrailingCommas(document: vscode.TextDocument): vscode.WorkspaceEdit {
  const edit = new vscode.WorkspaceEdit();

  for (let lineNumber = 0; lineNumber < document.lineCount - 1; lineNumber++) {
    const line = document.lineAt(lineNumber);
    const commaIndex = line.text.lastIndexOf(",");
    if (commaIndex === -1 || line.text.slice(commaIndex + 1).trim() !== "") continue;

    const nextNonEmptyLine = Array.from(
      { length: document.lineCount - lineNumber - 1 },
      (_, index) => document.lineAt(lineNumber + index + 1),
    ).find((candidate) => candidate.text.trim() !== "");
    if ((nextNonEmptyLine?.text.trimStart().startsWith("}")) ?? false) {
      edit.delete(document.uri, new vscode.Range(lineNumber, commaIndex, lineNumber, commaIndex + 1));
    }
  }

  return edit;
}
