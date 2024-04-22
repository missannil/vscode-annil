import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";
import * as vscode from "vscode";
import { ErrorType } from "./ErrorType";
// import { setDiagnosticListToCache } from "./diagnosticListCache";
import { getSubCompConfig } from "./diagnosticListCache/subCompConfigCache";
import { getElementTagListFromWxmlFile } from "./diagnosticListCache/subCompConfigCache/getElementTagListFromWxmlFile";
import { getImportedCustomComponentNames } from "./diagnosticListCache/usingComponentsConfigCache";
import { isComponentFile } from "./fileTypeChecks";
import { getElementList } from "./getElement";
import {
  generateElementDianosticList,
  getElementStartIndexById,
  getElementStartIndexByTag,
  getTagPosition,
} from "./getElementErrorInfo";
import { getSiblingUri } from "./getSiblingUri";

const diagnosticCollection =
  vscode.languages.createDiagnosticCollection(`annil`);

function getFixAllAction(
  wxmlUri: vscode.Uri,
  diagnosticList: readonly vscode.Diagnostic[]
): vscode.CodeAction {
  const fixAllAction = new vscode.CodeAction(
    "修复全部",
    vscode.CodeActionKind.QuickFix
  );
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
    if (
      errorType.includes(ErrorType.repeated) ||
      errorType.includes(ErrorType.unknown)
    ) {
      fixAllAction.edit.delete(wxmlUri, diagnostic.range);
      continue;
    }

    if (errorType === ErrorType.invalid) {
      // 生成诊断时借用code属性存储了正确的值
      fixAllAction.edit.replace(
        wxmlUri,
        diagnostic.range,
        diagnostic.code as string
      );
      continue;
    }
    if (errorType === ErrorType.empty) {
      fixAllAction.edit = new vscode.WorkspaceEdit();
      fixAllAction.edit.replace(
        wxmlUri,
        diagnostic.range,
        diagnostic.code as string
      );
    }
  }

  return fixAllAction;
}

const registerCodeActionsProvider =
  vscode.languages.registerCodeActionsProvider("wxml", {
    provideCodeActions(document, _range, context) {
      const fixActions: vscode.CodeAction[] = [];
      for (const diagnostic of context.diagnostics) {
        // 在生成诊断时,已经将错误类型存储在诊断的message属性中
        const errorType = diagnostic.message;

        // 如果是缺失元素的诊断,则不提供修复
        if (errorType === ErrorType.missingElement) continue;
        if (errorType.includes(ErrorType.missingAttributes)) {
          const missingAttrName = errorType.slice(errorType.indexOf(":"));
          const fixAction = new vscode.CodeAction(
            `添加${missingAttrName}属性`,
            vscode.CodeActionKind.QuickFix
          );
          fixAction.edit = new vscode.WorkspaceEdit();
          // 生成诊断时借用code属性存储了正确的值 前面加个空格避免和元素标签粘连在一起
          const insertCharactor = " " + diagnostic.code!;
          fixAction.edit.insert(
            document.uri,
            diagnostic.range.end,
            insertCharactor
          );
          fixActions.push(fixAction);
          continue;
        }
        if (
          errorType.includes(ErrorType.repeated) ||
          errorType.includes(ErrorType.unknown)
        ) {
          const fixAction = new vscode.CodeAction(
            "删除",
            vscode.CodeActionKind.QuickFix
          );
          fixAction.edit = new vscode.WorkspaceEdit();
          fixAction.edit.delete(document.uri, diagnostic.range);

          fixActions.push(fixAction);
          continue;
        }

        if (errorType === ErrorType.invalid) {
          // 生成诊断时借用code属性存储了正确的值
          const correctValue = diagnostic.code as string;
          const fixAction = new vscode.CodeAction(
            "修复",
            vscode.CodeActionKind.QuickFix
          );
          fixAction.edit = new vscode.WorkspaceEdit();
          fixAction.edit.replace(document.uri, diagnostic.range, correctValue);

          fixActions.push(fixAction);
          continue;
        }
        if (errorType === ErrorType.empty) {
          const fixAction = new vscode.CodeAction(
            "重写属性",
            vscode.CodeActionKind.QuickFix
          );
          fixAction.edit = new vscode.WorkspaceEdit();
          fixAction.edit.replace(
            document.uri,
            diagnostic.range,
            diagnostic.code as string
          );
          fixActions.push(fixAction);
          continue;
        }
      }

      const fixAllAction = getFixAllAction(
        document.uri,
        diagnosticCollection.get(document.uri)!
      );
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
    diagnosticCollection,
    registerCodeActionsProvider,
    vscode.commands.registerCommand("annil.fix-diagnostics", fixAllDiagnostics)
  );
}

export function isWxmlDiagnosticsVisible(wxmlUri: vscode.Uri): boolean {
  return diagnosticCollection.has(wxmlUri);
}

export function displayWxmlDiagnostics(
  wxmlUri: vscode.Uri,
  diagnosticList: vscode.Diagnostic[]
): void {
  diagnosticCollection.set(wxmlUri, diagnosticList);
}

export function hiddenWxmldiagnostics(wxmlUri: vscode.Uri): void {
  diagnosticCollection.delete(wxmlUri);
}

async function generateDiagnosticsFromJsonFile(
  wxmlUri: vscode.Uri,
  wxmlDocument: Domhandler.Document,
  lines: string[]
): Promise<vscode.Diagnostic[]> {
  const diagnosticList: vscode.Diagnostic[] = [];
  const jsonUri = getSiblingUri(wxmlUri, ".json");
  const importedCustomComponentNames = await getImportedCustomComponentNames(
    jsonUri
  );
  const wxmlTagList = getElementTagListFromWxmlFile(wxmlDocument);
  wxmlTagList.forEach((tagName) => {
    if (!importedCustomComponentNames.includes(tagName)) {
      const tagPosition = getTagPosition(tagName, lines, 0);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(
          tagPosition.startLine,
          tagPosition.startIndex,
          tagPosition.startLine,
          tagPosition.endIndex
        ),
        `Json文件中未导入:${tagName}组件`,
        vscode.DiagnosticSeverity.Error
      );
      diagnosticList.push(diagnostic);
    }
  });

  return diagnosticList;
}

async function generateDiagnosticsFromTsFile(
  wxmlUri: vscode.Uri,
  wxmlDom: Domhandler.Document,
  wxmlTextlines: string[]
): Promise<vscode.Diagnostic[]> {
  const diagnosticList: vscode.Diagnostic[] = [];
  const tsUri = getSiblingUri(wxmlUri, ".ts");
  const subCompConfig = await getSubCompConfig(tsUri);
  // 获取ts文件诊断(对ts文件中的每个组件配置对应的wxml元素进行诊断)
  for (const subCompName in subCompConfig) {
    const elements = getElementList(wxmlDom, subCompName);
    if (elements === null) {
      // wxml中缺少对应组件配置的元素(元素名或id值都不等于subCompName),诊断标记在wxml的第一行,无法自动修复
      diagnosticList.push(
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `${ErrorType.missingElement}:${subCompName}`,
          vscode.DiagnosticSeverity.Error
        )
      );
      continue;
    }
    // 匹配的是id元素只有一个
    if (!Array.isArray(elements)) {
      // 获取元素(标签)的起始行数,提高后续查找的效率
      const elementStartLine = getElementStartIndexById(
        wxmlTextlines,
        elements.name,
        elements.attribs.id
      );
      diagnosticList.push(
        ...generateElementDianosticList(
          elements,
          subCompConfig[subCompName],
          wxmlTextlines,
          elementStartLine
        )
      );
    } else {
      // 匹配得是标签元素,为数组,可能有多个
      for (let index = 0; index < elements.length; index++) {
        const element = elements[0];
        // 获取元素(标签)的起始行数,提高后续查找的效率(循环时索引起始位置)
        const elementStartLine = getElementStartIndexByTag(
          wxmlTextlines,
          element.name,
          index
        );
        diagnosticList.push(
          ...generateElementDianosticList(
            elements[index],
            subCompConfig[subCompName],
            wxmlTextlines,
            elementStartLine
          )
        );
      }
    }
  }

  return diagnosticList;
}

/**
 * @param wxmlUri wxml文件的文本文档
 */
export async function updateDiagnostics(wxmlUri: vscode.Uri): Promise<void> { 
  const diagnosticList: vscode.Diagnostic[] = [];
  const wxmlDocument = await vscode.workspace.openTextDocument(wxmlUri);
  const wxmlText = wxmlDocument.getText();
  const wxmlDom = htmlparser2.parseDocument(wxmlText, {
    xmlMode: true,
  });
  const wxmlTextlines = wxmlText.split(/\r?\n/);
  diagnosticList.push(
    ...(await generateDiagnosticsFromJsonFile(wxmlUri, wxmlDom, wxmlTextlines))
  );
  diagnosticList.push(
    ...(await generateDiagnosticsFromTsFile(wxmlUri, wxmlDom, wxmlTextlines))
  );

  // setDiagnosticListToCache(wxmlUri.fsPath, diagnosticList);

  displayWxmlDiagnostics(wxmlUri, diagnosticList);
}
