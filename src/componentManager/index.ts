import * as vscode from "vscode";
import { getSiblingUri } from "../componentManager/getSiblingUri";
import { diagnosticManager } from "../diagnosticManager";
import { jsonChecker } from "../jsonChecker";
import { debounce } from "../utils/debounce";
import { wxmlChecker } from "../wxmlChecker";
import { isComponentUri, type JsonUri, type TsUri, type WxmlUri } from "./isComponentUri";
import { jsonFileManager } from "./jsonFileManager";
import { tsFileManager } from "./tsFileManager";
import { wxmlFileManager } from "./wxmlFileManager";
type CheckingFileFsPath = string;
class ComponentManager {
  // 记录当前正在检测的文件,因为打开同一组件(json,wxml,ts)任意一个文件时,都会自动打开另2个文件(获取相关配置),这样就会导致发出检测同一个wxml文件(3次),此列表用于避免重复检测(当要诊断一个wxml文件时,判断是否已经在检测列表中)。
  #checkingList: CheckingFileFsPath[] = [];
  private isChecking(wxmlPath: string): boolean {
    // console.log("检测队列中是否包含");
    return this.#checkingList.includes(wxmlPath);
  }
  public addCheckingQueue(wxmlPath: string): void {
    // console.log("加入队列", wxmlPath);
    this.#checkingList.push(wxmlPath);
  }
  public removeCheckingQueue(wxmlPath: string): void {
    // console.log("移除队列", wxmlPath);
    const index = this.#checkingList.indexOf(wxmlPath);
    if (index !== -1) {
      this.#checkingList.splice(index, 1);
    } else {
      throw new Error("检测列表中没有这个文件");
    }
  }
  #checkCompletedCallbacks: Record<string, undefined | ((diagnosticList: vscode.Diagnostic[]) => void)> = {};
  // 在进行拓展测试时会用到,记得要取消注册(deregisterCheckCompletedCallback)
  public registerCheckCompletedCallback(wxmlFsPath: string, cb: (diagnosticList: vscode.Diagnostic[]) => void): void {
    this.#checkCompletedCallbacks[wxmlFsPath] = cb;
  }
  public deregisterCheckCompletedCallback(wxmlFsPath: string): void {
    delete this.#checkCompletedCallbacks[wxmlFsPath];
  }
  private isTsFile(uri: vscode.Uri): uri is TsUri {
    return uri.fsPath.endsWith(".ts");
  }
  private isJsonFile(uri: vscode.Uri): uri is JsonUri {
    return uri.fsPath.endsWith(".json");
  }
  private isWxmlFile(uri: vscode.Uri): uri is WxmlUri {
    return uri.fsPath.endsWith(".wxml");
  }
  private async updateComponentFile(textDocument: vscode.TextDocument): Promise<void> {
    const uri = textDocument.uri;
    if (this.isTsFile(uri)) {
      await tsFileManager.update(uri.fsPath, textDocument.getText());
    }
    if (this.isJsonFile(uri)) {
      await jsonFileManager.update(uri.fsPath);
    }
    if (this.isWxmlFile(uri)) {
      await wxmlFileManager.update(uri.fsPath);
    }
  }
  private async onOpenTextEditor(uri: vscode.Uri): Promise<void> {
    const wxmlUri = getSiblingUri(uri, ".wxml");
    if (isComponentUri(uri) && this.shouldCheckFile(wxmlUri)) {
      this.addCheckingQueue(wxmlUri.fsPath);
      const wxmlFileInfo = await wxmlFileManager.get(wxmlUri.fsPath);
      const tsFileInfo = await tsFileManager.get(getSiblingUri(wxmlUri, ".ts").fsPath);

      wxmlChecker.start(wxmlUri, wxmlFileInfo, tsFileInfo);
      this.removeCheckingQueue(wxmlUri.fsPath);
      const jsonUri = getSiblingUri(wxmlUri, ".json");
      const jsonFileInfo = await jsonFileManager.get(jsonUri.fsPath);
      jsonChecker.start(jsonUri, jsonFileInfo, tsFileInfo);
    } else {
      // console.log("不是组件文件,或者已经有诊断信息了,或者正在检测中",uri.fsPath)
    }
  }
  private async visibleTextEditorsHandler(): Promise<void> {
    const visibleTextEditors = vscode.window.visibleTextEditors;
    for (const textEditor of visibleTextEditors) {
      await this.onOpenTextEditor(textEditor.document.uri);
    }
  }
  // 是否应该检测这个文件,如果已经有诊断信息了,或者正在检测中,则不检测
  private shouldCheckFile(wxmlUri: WxmlUri): boolean {
    return !diagnosticManager.has(wxmlUri) && !this.isChecking(wxmlUri.fsPath);
  }
  private onDidOpenComponentFileHandler(): void {
    vscode.workspace.onDidOpenTextDocument(async (textDocument) => {
      await this.onOpenTextEditor(textDocument.uri);
    });
  }
  private onDidChangeComponentFileHandler(): void {
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const debounceCheckerHandler = debounce(wxmlChecker.start, 100);
      // 如果没有内容变化,则不处理(比如只是保存文件,但是文件内容没有变化)
      if (event.contentChanges.length === 0) return;
      const textDocument = event.document;
      const uri = textDocument.uri;
      if (isComponentUri(uri)) {
        await this.updateComponentFile(textDocument);
        const wxmlUri = getSiblingUri(uri, ".wxml");
        const wxmlFileInfo = await wxmlFileManager.get(wxmlUri.fsPath);
        const tsFileInfo = await tsFileManager.get(getSiblingUri(wxmlUri, ".ts").fsPath);
        debounceCheckerHandler.call(wxmlChecker, wxmlUri, wxmlFileInfo, tsFileInfo);
      }
    });
  }
  private onDeleteComponentFileHandler(): void {
    vscode.workspace.onDidDeleteFiles(async (event) => {
      event.files.forEach((uri) => {
        if (isComponentUri(uri)) {
          diagnosticManager.delete(getSiblingUri(uri, ".wxml"));
        }
      });
    });
  }
  public init(): void {
    this.onDidOpenComponentFileHandler();
    this.onDidChangeComponentFileHandler();
    this.onDeleteComponentFileHandler();
    void this.visibleTextEditorsHandler();
  }
}

export const componentManager = new ComponentManager();
