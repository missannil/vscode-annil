import * as vscode from "vscode";
import { debounce } from "./debounce";
import { isWxmlDiagnosticsVisible, registerSubscriptions, updateDiagnostics } from "./diagnosticCollection";
import { setSubCompConfigToCache } from "./diagnosticListCache/subCompConfigCache";
import { getSubCompConfigFromText } from "./diagnosticListCache/subCompConfigCache/getSubCompConfigFromText";
import {
  getImportedCustomComponentNamesFromText,
  setImportedCustomComponentNamesToCache,
} from "./diagnosticListCache/usingComponentsConfigCache";
import { isComponentFile, isJsonFile, isTsFile } from "./fileTypeChecks";
import { getSiblingUri } from "./getSiblingUri";

async function visibleTextEditorsHandler(): Promise<void> {
  const visibleTextEditors = vscode.window.visibleTextEditors;
  for (const textEditor of visibleTextEditors) {
    await onOpenTextEditor(textEditor);
  }
}

async function onOpenTextEditor(textEditor: vscode.TextEditor) {
  const uri = textEditor.document.uri;
  if (isComponentFile(uri)) {
    const wxmlUri = getSiblingUri(uri, ".wxml");
    if (!isWxmlDiagnosticsVisible(wxmlUri)) {
      await updateDiagnostics(wxmlUri);
    }
  }
}

function onDidChangeActiveTextEditor() {
  vscode.window.onDidChangeActiveTextEditor(async (activeEditor) => {
    activeEditor && (await onOpenTextEditor(activeEditor));
  });
}

function onComponentFileDidChangeTextDocument() {
  const debouncedUpdateDiagnostics = debounce(updateDiagnostics, 100);
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
        const usingComponentKeys = getImportedCustomComponentNamesFromText(documentText);
        setImportedCustomComponentNamesToCache(fsPath, usingComponentKeys);
      }
      debouncedUpdateDiagnostics(getSiblingUri(uri, ".wxml"));
    }
  });
}

export async function initializeWxmlDiagnostics(
  context: vscode.ExtensionContext,
): Promise<void> {
  registerSubscriptions(context);
  visibleTextEditorsHandler();
  onDidChangeActiveTextEditor();
  onComponentFileDidChangeTextDocument();
}
