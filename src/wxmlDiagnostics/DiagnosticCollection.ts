import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";
import * as vscode from "vscode";
import { setDiagnosticListToCache } from "./diagnosticListCache";
import { getSubCompConfig } from "./diagnosticListCache/subCompConfigCache";
import { getElementTagListFromWxmlFile } from "./diagnosticListCache/subCompConfigCache/getElementTagListFromWxmlFile";
import { getUsingComponentConfig } from "./diagnosticListCache/usingComponentsConfigCache";
import { ErrorType } from "./ErrorType";
import { isComponentFile } from "./fileTypeChecks";
import { getElementList } from "./getElement";
import { generateElementDianosticList, getTagPosition } from "./getElementErrorInfo";
import { getSiblingUri } from "./getSiblingUri";

const diagnosticCollection = vscode.languages.createDiagnosticCollection(`annil`);

function getFixAllAction(
  wxmlUri: vscode.Uri,
  diagnosticList: readonly vscode.Diagnostic[],
): vscode.CodeAction {
  const fixAllAction = new vscode.CodeAction("修复全部", vscode.CodeActionKind.QuickFix);
  fixAllAction.edit = new vscode.WorkspaceEdit();
  for (const diagnostic of diagnosticList) {
    const errorType = diagnostic.message;
    if (errorType === ErrorType.missingElement) continue;
    if (errorType.includes(ErrorType.missingAttributes)) {
      // 生成诊断时借用code属性存储了正确的值 前面加个空格避免和元素标签粘连在一起
      const insertCharactor = " " + diagnostic.code!;
      fixAllAction.edit!.insert(wxmlUri, diagnostic.range.end, insertCharactor);
      continue;
    }
    if (errorType.includes(ErrorType.repeated) || errorType.includes(ErrorType.unknown)) {
      fixAllAction.edit.delete(wxmlUri, diagnostic.range);
      continue;
    }

    if (errorType === ErrorType.invalid) {
      // 生成诊断时借用code属性存储了正确的值
      fixAllAction.edit.replace(wxmlUri, diagnostic.range, diagnostic.code as string);
      continue;
    }
  }

  return fixAllAction;
}

const registerCodeActionsProvider = vscode.languages.registerCodeActionsProvider("wxml", {
  provideCodeActions(document, _range, context) {
    const fixActions: vscode.CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      // 在生成诊断时,已经将错误类型存储在诊断的message属性中
      const errorType = diagnostic.message;

      // 如果是缺失元素的诊断,则不提供修复
      if (errorType === ErrorType.missingElement) continue;
      if (errorType.includes(ErrorType.missingAttributes)) {
        const missingAttrName = errorType.split(":")[1];
        const fixAction = new vscode.CodeAction(`添加${missingAttrName}属性`, vscode.CodeActionKind.QuickFix);
        fixAction.edit = new vscode.WorkspaceEdit();
        // 生成诊断时借用code属性存储了正确的值 前面加个空格避免和元素标签粘连在一起
        const insertCharactor = " " + diagnostic.code!;
        fixAction.edit.insert(document.uri, diagnostic.range.end, insertCharactor);
        fixActions.push(fixAction);
        continue;
      }
      if (errorType.includes(ErrorType.repeated) || errorType.includes(ErrorType.unknown)) {
        const fixAction = new vscode.CodeAction("删除", vscode.CodeActionKind.QuickFix);
        fixAction.edit = new vscode.WorkspaceEdit();
        fixAction.edit.delete(document.uri, diagnostic.range);

        fixActions.push(fixAction);
        continue;
      }

      if (errorType === ErrorType.invalid) {
        // 生成诊断时借用code属性存储了正确的值
        const correctValue = diagnostic.code as string;
        const fixAction = new vscode.CodeAction("修复", vscode.CodeActionKind.QuickFix);
        fixAction.edit = new vscode.WorkspaceEdit();
        fixAction.edit.replace(document.uri, diagnostic.range, correctValue);

        fixActions.push(fixAction);
        continue;
      }
    }

    const fixAllAction = getFixAllAction(document.uri, diagnosticCollection.get(document.uri)!);
    fixActions.push(fixAllAction);

    return fixActions;
  },
});

function fixAllDiagnostics() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return;
  const uri = activeEditor.document.uri;
  const wxmlUri = getSiblingUri(uri, ".wxml");
  if (!isComponentFile(uri)) return;
  const diagnosticList = diagnosticCollection.get(wxmlUri);
  const fixAllAction = getFixAllAction(wxmlUri, diagnosticList!);
  vscode.workspace.applyEdit(fixAllAction.edit!);
}

export function registerSubscriptions(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    // 诊断集合加入到context.subscriptions中,便于vscode在插件被禁用或卸载时释放诊断集合
    diagnosticCollection,
    // 注册代码动作提供者,用于提供代码动作(修复代码)的提供者
    registerCodeActionsProvider,
    // 注册修复全部的命令
    vscode.commands.registerCommand("annil.fix-diagnostics", fixAllDiagnostics),
  );
}

export function isWxmlDiagnosticsVisible(wxmlUri: vscode.Uri): boolean {
  return diagnosticCollection.has(wxmlUri);
}

export function displayWxmlDiagnostics(wxmlUri: vscode.Uri, diagnosticList: vscode.Diagnostic[]): void {
  diagnosticCollection.set(wxmlUri, diagnosticList);
}

export function hiddenWxmldiagnostics(wxmlUri: vscode.Uri): void {
  console.log(wxmlUri);
  diagnosticCollection.delete(wxmlUri);
}

// 获取与json文件关联的诊断信息(是否有自定义组件未导入)
async function generateDiagnosticsFromJsonFile(
  jsonUri: vscode.Uri,
  wxmlDocument: Domhandler.Document,
  lines: string[],
): Promise<vscode.Diagnostic[]> {
  const diagnosticList: vscode.Diagnostic[] = [];
  const usingComponentsKeys = await getUsingComponentConfig(jsonUri);
  // 获取wxml中自定义组件名称数组
  const wxmlTagList = getElementTagListFromWxmlFile(wxmlDocument);
  wxmlTagList.forEach((tagName) => {
    if (!usingComponentsKeys!.includes(tagName)) {
      const tagPosition = getTagPosition(tagName, lines, 0);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(
          tagPosition.startLine,
          tagPosition.startIndex,
          tagPosition.startLine,
          tagPosition.endIndex,
        ),
        `Json文件中未导入:${tagName}`,
        vscode.DiagnosticSeverity.Error,
      );

      diagnosticList.push(diagnostic);
    }
  });

  return diagnosticList;
}

/**
 * @param wxmlUri wxml文件的文本文档
 */
export async function updateDiagnostics(
  wxmlUri: vscode.Uri,
): Promise<void> {
  const diagnosticList: vscode.Diagnostic[] = [];
  const wxmlDocument = await vscode.workspace.openTextDocument(wxmlUri);
  const wxmlText = wxmlDocument.getText();
  const wxmlDom: Domhandler.Document = htmlparser2.parseDocument(wxmlText, {
    xmlMode: true,
  });
  const wxmlTextlines = wxmlText.split(/\r?\n/);

  // 获取json文件中的诊断信息
  diagnosticList.push(
    ...await generateDiagnosticsFromJsonFile(getSiblingUri(wxmlUri, ".json"), wxmlDom, wxmlTextlines),
  );
  const tsUri = getSiblingUri(wxmlUri, ".ts");
  const subCompConfig = await getSubCompConfig(tsUri);

  // 获取ts文件诊断(对ts文件中的每个组件配置对应的wxml元素进行诊断)
  for (const subCompName in subCompConfig) {
    const elementList = getElementList(wxmlDom, subCompName);
    if (elementList.length === 0) {
      // wxml中缺少对应组件配置的元素(元素名或id值都不等于subCompName),诊断标记在wxml的第一行,无法自动修复
      diagnosticList.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `${ErrorType.missingElement}:${subCompName}`,
          vscode.DiagnosticSeverity.Error,
        ),
      );
    } else {
      // 对每个元素进行诊断
      for (let index = 0; index < elementList.length; index++) {
        diagnosticList.push(
          ...generateElementDianosticList(
            elementList[index],
            subCompConfig[subCompName],
            wxmlTextlines,
            index,
          ),
        );
      }
    }
  }
  setDiagnosticListToCache(wxmlUri.fsPath, diagnosticList);

  displayWxmlDiagnostics(wxmlUri, diagnosticList);
}
