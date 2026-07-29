import { vscode } from "#deps";
import { getSiblingUri, isComponentUri, isJsonFile } from "../utils/uriHelper.js";
import { generateCommentCodeActions } from "./commentFix.js";
import {
  generateInvalidPathCodeAction,
  generateMissingImportCodeAction,
  generateMissingPlaceholderCodeAction,
  generateUnknownConfigKeyCodeAction,
  generateUnknownImportCodeAction,
  generateUnknownPlaceholderCodeAction,
} from "./jsonFix.js";
import { DiagMsg, type DiagnosticMessage } from "./messages.js";

const EXTENSION_NAME = "vscode-annil";

// ---------- 消息类型守卫 ----------

function isCommentError(msg: DiagnosticMessage): boolean {
  return ([
    DiagMsg.invalidCommentText,
    DiagMsg.noStartedComment,
    DiagMsg.repeatedComment,
    DiagMsg.invalidCommentLocation,
  ] as readonly string[]).includes(msg);
}

function isDuplicateId(msg: DiagnosticMessage): boolean {
  return msg === DiagMsg.duplicateId;
}

// ---------- WXML CodeAction 分发 ----------

/**
 * 根据单个诊断消息生成对应的 CodeAction 列表
 */
function generateWxmlCodeActions(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  const msg = diagnostic.message as DiagnosticMessage;

  if (isCommentError(msg)) {
    return generateCommentCodeActions(wxmlUri, diagnostic);
  }

  if (isDuplicateId(msg)) {
    // 重复 id 暂不提供自动修复（用户需手动修改 id 值）
    return [];
  }

  return [];
}

function generateJsonCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code === undefined) return [];

  if (diagnostic.message === DiagMsg.unknownImport) {
    return [generateUnknownImportCodeAction(document, diagnostic)];
  }
  if (diagnostic.message === DiagMsg.unknownPlaceholder) {
    return [generateUnknownPlaceholderCodeAction(document, diagnostic)];
  }
  if (diagnostic.message === DiagMsg.missingImport) {
    const action = generateMissingImportCodeAction(document, diagnostic);

    return action === undefined ? [] : [action];
  }
  if (diagnostic.message === DiagMsg.missingPlaceholder) {
    return [generateMissingPlaceholderCodeAction(document, diagnostic)];
  }
  if (diagnostic.message === DiagMsg.invalidPath) {
    const action = generateInvalidPathCodeAction(document, diagnostic);

    return action === undefined ? [] : [action];
  }
  if (diagnostic.message === DiagMsg.unknownConfigKey) {
    return [generateUnknownConfigKeyCodeAction(document, diagnostic)];
  }

  return [];
}

function generateCodeActionsForDiagnostic(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (document.languageId === "wxml") return generateWxmlCodeActions(document.uri, diagnostic);
  if (document.languageId === "json") return generateJsonCodeActions(document, diagnostic);

  return [];
}

/** 获取单个诊断的第一个真实 Quick Fix。 */
function getFirstCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const action = generateCodeActionsForDiagnostic(document, diagnostic)[0];
  if (!action?.edit) return undefined;

  return action;
}

/** 取 Action 中最靠后的文本位置，用于 fix-all 的安全逆序应用。 */
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

/** 清理 fix-all 多编辑在对象末项遗留的 JSON 尾逗号，保留原有缩进与其他内容。 */
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

// ---------- CodeActionProvider ----------

class WxmlCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (context.diagnostics.length === 0) return [];

    const wxmlUri = document.uri;
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      // 只处理本插件产生的诊断
      if (diagnostic.source !== EXTENSION_NAME) continue;
      // 只处理与请求范围相交的诊断（VS Code 可能传入文件中全部诊断）
      if (!diagnostic.range.intersection(range)) continue;
      actions.push(...generateWxmlCodeActions(wxmlUri, diagnostic));
    }

    return actions;
  }
}

/** 为 JSON 配置诊断提供最小 Quick Fix 集合。 */
class JsonCodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    return context.diagnostics.flatMap((diagnostic) => {
      if (diagnostic.source !== EXTENSION_NAME) return [];
      if (!diagnostic.range.intersection(range)) return [];

      return generateJsonCodeActions(document, diagnostic);
    });
  }
}

// ---------- 注册 ----------

/**
 * 注册 WXML/JSON CodeActionProvider 和组件级全局修复命令
 */
export function registerCodeActionProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("wxml", new WxmlCodeActionProvider()),
  );
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("json", new JsonCodeActionProvider()),
  );

  // 注册组件级修复命令（annil.fix-all）
  context.subscriptions.push(
    // eslint-disable-next-line complexity
    vscode.commands.registerCommand("annil.fix-all", async () => {
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
          if (diagnostic.source !== EXTENSION_NAME) continue;
          // 每个诊断只执行第一个修复操作；新诊断由下一次 fix-all 处理。
          const action = getFirstCodeAction(document, diagnostic);
          if (action !== undefined) {
            fixActions.push({ diagnostic, document, lastOffset: getActionLastOffset(document, action) });
          }
        }
      }

      if (fixActions.length > 0) {
        // 后向前应用可保持尚未执行的前方编辑坐标有效，并避免 JSON 属性编辑重叠。
        fixActions.sort((left, right) => right.lastOffset - left.lastOffset);
        for (const { diagnostic, document } of fixActions) {
          // 前序编辑可能改变同一对象的末项逗号，因此在应用前重新生成编辑。
          const action = getFirstCodeAction(document, diagnostic);
          if (action?.edit) await vscode.workspace.applyEdit(action.edit);
        }
        for (const uri of componentUris) {
          if (!isJsonFile(uri)) continue;
          const document = await vscode.workspace.openTextDocument(uri);
          const cleanupEdit = cleanupJsonTrailingCommas(document);
          if (cleanupEdit.size > 0) await vscode.workspace.applyEdit(cleanupEdit);
        }
        vscode.window.showInformationMessage("annil: 已修复全部");
      } else {
        vscode.window.showInformationMessage("annil: 当前组件没有可修复的诊断");
      }
    }),
  );
}
