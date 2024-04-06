import * as vscode from "vscode";
import {
  hiddenWxmldiagnostics,
  isWxmlDiagnosticsVisible,
  registerSubscriptions,
  updateDiagnostics,
} from "./diagnosticCollection";
import { setSubCompConfigToCache } from "./diagnosticListCache/subCompConfigCache";
import { getSubCompConfigFromText } from "./diagnosticListCache/subCompConfigCache/getSubCompConfigFromText";
import {
  getUsingComponentConfigFromText,
  setUsingComponentsConfigToCache,
} from "./diagnosticListCache/usingComponentsConfigCache";
import { isComponentFile, isJsonFile, isTsFile, isWxmlFile } from "./fileTypeChecks";
import { getSiblingUri } from "./getSiblingUri";

async function visibleTextEditorsHandler(): Promise<void> {
  const visibleTextEditors = vscode.window.visibleTextEditors;
  for (const textEditor of visibleTextEditors) {
    console.log(111)
    await onOpenTextEditor(textEditor);
  }
}

async function onOpenTextEditor(textEditor: vscode.TextEditor) {
  const uri = textEditor.document.uri;
  if (isComponentFile(uri)) {
    const wxmlUri = getSiblingUri(uri, ".wxml");
    if (!isWxmlDiagnosticsVisible(wxmlUri)) {
      await updateDiagnostics(wxmlUri);
    } else {
      // console.log("wxml diagnostics is visible");
    }
  }
}

function onDidChangeActiveTextEditor() {
  vscode.window.onDidChangeActiveTextEditor(async (activeEditor) => {
    activeEditor && await onOpenTextEditor(activeEditor);
  });
}

function onCloseWxmlFileHandle() {
  vscode.workspace.onDidCloseTextDocument((document) => {
    const { uri } = document;
    if (isWxmlFile(uri)) {
      hiddenWxmldiagnostics(uri);
    }
  });
}

function onComponentFileDidChangeTextDocument() {
  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.contentChanges.length === 0) return;
    const uri = event.document.uri;
    const document = event.document;
    if (isComponentFile(uri)) {
      const documentText = document.getText();
      const fsPath = uri.fsPath;
      if (isTsFile(uri)) {
        const allSubCompAttrs = getSubCompConfigFromText(documentText);
        setSubCompConfigToCache(fsPath, allSubCompAttrs);
      }
      if (isJsonFile(uri)) {
        const usingComponentKeys = getUsingComponentConfigFromText(documentText);
        setUsingComponentsConfigToCache(fsPath, usingComponentKeys);
      }
      updateDiagnostics(getSiblingUri(uri, ".wxml"));
    }
  });
}

export async function initializeWxmlDiagnostics(context: vscode.ExtensionContext): Promise<void> {
  registerSubscriptions(context);
  visibleTextEditorsHandler();
  onDidChangeActiveTextEditor();
  onComponentFileDidChangeTextDocument();
  // onCloseWxmlFileHandle();
}
