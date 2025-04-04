import type { Uri } from "vscode";
import * as vscode from "vscode";
import { diagnosticCollection } from "../diagnosticCollection";
import { JsonChecker } from "../jsonChecker";
import { debounce } from "../utils/debounce";
import { wxmlChecker } from "../wxmlChecker";
import { jsonFileManager } from "./jsonFileManager";
import { tsFileManager } from "./tsFileManager";
import type { TsFileInfo } from "./tsFileManager/types";
import {
  type ComponentDirPath,
  type ComponentUri,
  type JsonFsPath,
  type JsonUri,
  type TsUri,
  uriHelper,
  type WxmlFsPath,
  type WxmlUri,
} from "./uriHelper";
import { wxmlFileManager } from "./wxmlFileManager";

type CallBackDict = Record<
  JsonFsPath | WxmlFsPath,
  ((diagnosticList: readonly vscode.Diagnostic[]) => void) | undefined
>;

class ComponentManager {
  #relatedUris: Record<string, TsUri> = {};
  public get relatedUris(): Record<string, TsUri | undefined> {
    return this.#relatedUris;
  }
  public setRelatedUris(fsPath: string, tsUri: TsUri): void {
    this.#relatedUris[fsPath] = tsUri;
  }
  public isRelatedUri(uri: Uri): boolean {
    return uri.fsPath in this.#relatedUris;
  }
  // 记录当前正在检测的组件的目录路径(要求一个组件文件夹下只能有一组(`.js`、`.wxml`、`.json`)组件文件,即不可讲多个组件写在同一文件夹下)
  #checkingQueue: ComponentDirPath[] = [];
  // 检测后执行回调函数的集合,为了测试
  #checkedCallbacks: CallBackDict = {} as CallBackDict;
  // 注册检测后执行的回调函数
  public registerCheckedCallback(
    fsPath: JsonFsPath | WxmlFsPath,
    cb: (diagnosticList: readonly vscode.Diagnostic[]) => void,
  ): void {
    this.#checkedCallbacks[fsPath] = cb;
  }
  // 注销检测后执行的回调函数
  public unRegisterCheckedCallback(fsPath: JsonFsPath | WxmlFsPath): void {
    delete this.#checkedCallbacks[fsPath];
  }
  // 组件是否正在检测(如果在检测队列中,则返回true表示正在检测)
  #isChecking(componentDirPath: ComponentDirPath): boolean {
    return this.#checkingQueue.includes(componentDirPath);
  }
  // uri是否需要检测 (如果uri是组件文件,且没有检测过,且不在检测队列中,则返回true表示需要检测)
  #isComponentNeedCheck(dirPath: ComponentDirPath): boolean {
    return !diagnosticCollection.hasChecked(dirPath) && !this.#isChecking(dirPath);
  }
  // 将组件目录路径加入检测队列
  #addCheckingQueue(componentDirPath: ComponentDirPath): void {
    this.#checkingQueue.push(componentDirPath);
  }
  // 将组件目录路径从检测队列中移除
  #removeCheckingQueue(componentDirPath: ComponentDirPath): void {
    const index = this.#checkingQueue.indexOf(componentDirPath);
    if (index !== -1) {
      this.#checkingQueue.splice(index, 1);
    } else {
      throw new Error("检测列表中没有这个文件");
    }
  }
  // 在激活插件后,检测当前打开的文本编辑器,如果是组件文件,则检测组件文件
  async #visibleTextEditorsHandler(): Promise<void> {
    const visibleTextEditors = vscode.window.visibleTextEditors;
    for (const textEditor of visibleTextEditors) {
      const uri = textEditor.document.uri;
      if (uriHelper.isComponentUri(uri)) {
        await this.#checkComponent(uri);
      }
    }
  }

  // 删除组件文件时的处理,删除组件文件的诊断信息(key为jsonUri,WxmlUri)和已检测的标记(key为dirPath)
  #onDidDeleteFilesHandler(): void {
    vscode.workspace.onDidDeleteFiles(async (event) => {
      // vscode uri的schema无法判断是文件还是文件夹(都file),所以只能通过其他方法判断。
      for (const uri of event.files) {
        let dirPath: string;
        let jsonUri: JsonUri;
        let wxmlUri: WxmlUri;
        if (uriHelper.fileOrDir(uri) === "file") {
          dirPath = uri.fsPath.split("/").slice(0, -1).join("/");
          jsonUri = uriHelper.getSiblingUri(uri, ".json");
          wxmlUri = uriHelper.getSiblingUri(uri, ".wxml");
        } else {
          dirPath = uri.fsPath;
          const componentName = uriHelper.getComponentName(dirPath);
          jsonUri = vscode.Uri.joinPath(uri, `${componentName}.json`) as JsonUri;
          wxmlUri = vscode.Uri.joinPath(uri, `${componentName}.wxml`) as WxmlUri;
        }
        diagnosticCollection.removeChecked(dirPath);
        diagnosticCollection.delete(jsonUri);
        diagnosticCollection.delete(wxmlUri);
      }
    });
  }
  // 组件文件内容变化时,重新检测组件文件
  #onDidChangeComponentFileHandler(): void {
    const debounceCheckComopnentHandler = debounce(this.#checkComponent, 200);
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const textDocument = event.document;
      const uri = textDocument.uri;
      // 如果没有内容变化,则不处理(比如只是保存文件,但是文件内容没有变化)或者不是组件文件,也不处理
      if (event.contentChanges.length === 0 || !uriHelper.isComponentUri(uri) && !this.isRelatedUri(uri)) {
        return;
      }
      // 如果是相关文件,则更新相关文件(.ts)的内容
      if (this.isRelatedUri(uri)) {
        const tsUri = this.#relatedUris[uri.fsPath];
        const relatedUri = uri as TsUri;
        await tsFileManager.update(tsUri, {
          type: "related",
          uri: relatedUri,
          text: textDocument.getText(),
        });

        debounceCheckComopnentHandler.call(this, tsUri, false);
      } else if (uriHelper.isComponentUri(uri)) {
        const changedText = textDocument.getText();
        if (uriHelper.isWxmlFile(uri)) {
          await wxmlFileManager.update(uri, changedText);
        } else if (uriHelper.isJsonFile(uri)) {
          await jsonFileManager.update(uri, changedText);
        } else if (uriHelper.isTsFile(uri)) {
          await tsFileManager.update(uri, { type: "main", text: changedText });
        }
        debounceCheckComopnentHandler.call(this, uri, false);
      }
    });
  }
  // 检测wxml文件,如果有回调函数,则执行回调函数(为了测试)
  async #checkWxmlFile(wxmlUri: WxmlUri, tsFileInfo?: TsFileInfo): Promise<void> {
    if (!tsFileInfo) {
      tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(wxmlUri, ".ts"));
    }
    const wxmlFileInfo = await wxmlFileManager.get(wxmlUri);
    const diagnosticList = wxmlChecker(wxmlFileInfo, tsFileInfo);

    // 删除原有的诊断信息
    diagnosticCollection.delete(wxmlUri);
    diagnosticCollection.set(wxmlUri, diagnosticList);
    // 为了测试
    const wxmlCb = this.#checkedCallbacks[wxmlUri.fsPath as WxmlFsPath];
    wxmlCb && wxmlCb(diagnosticList);
  }
  // 检测json文件,如果有回调函数,则执行回调函数(为了测试)
  async #checkJsonFile(
    jsonUri: JsonUri,
    tsFileInfo?: TsFileInfo,
    wxmlCustomComponents?: string[],
  ): Promise<void> {
    if (!tsFileInfo) {
      tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(jsonUri, ".ts"));
    }
    if (!wxmlCustomComponents) {
      const wxmlUri = uriHelper.getSiblingUri(jsonUri, ".wxml");
      wxmlCustomComponents = (await wxmlFileManager.get(wxmlUri)).componentTagNameList;
    }
    const jsonFileInfo = await jsonFileManager.get(jsonUri);
    const checker = new JsonChecker(jsonFileInfo, wxmlCustomComponents, tsFileInfo);
    const diagnosticList = checker.start();
    // diagnosticCollection.delete(jsonUri);
    diagnosticCollection.set(jsonUri, diagnosticList);
    // 为了测试
    const jsonFsPath = uriHelper.getJsonFsPath(jsonUri);
    const jsonCb = this.#checkedCallbacks[jsonFsPath];
    jsonCb && jsonCb(diagnosticList);
  }

  /**
   * 检测组件文件
   * @param componentUri
   * @param enableQueue 是否考虑队列(考虑队列，可避免重复检测，但在响应修改文件时不应考虑队列)
   */
  async #checkComponent(componentUri: ComponentUri, enableQueue = true): Promise<void> {
    const componentDirPath = uriHelper.getComponentDirPath(componentUri);
    if (enableQueue) {
      this.#addCheckingQueue(componentDirPath);
    }
    const tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(componentUri, ".ts"));
    const wxmlUri = uriHelper.getSiblingUri(componentUri, ".wxml");
    await this.#checkWxmlFile(wxmlUri, tsFileInfo);
    const jsonUri = uriHelper.getSiblingUri(componentUri, ".json");
    await this.#checkJsonFile(jsonUri, tsFileInfo);

    diagnosticCollection.addChecked(componentDirPath);
    if (enableQueue) {
      this.#removeCheckingQueue(componentDirPath);
    }
  }
  // 当打开一个文件时,如果不是组件文件或者已经检测过(不需要检测),则不处理,否则检测组件文件
  #onDidOpenTextDocumentHandler(): void {
    vscode.workspace.onDidOpenTextDocument(async (textDocument) => {
      const uri = textDocument.uri;
      if (!uriHelper.isComponentUri(uri) || !this.#isComponentNeedCheck(uriHelper.getComponentDirPath(uri))) return;
      await this.#checkComponent(uri);
    });
  }
  public init(): void {
    this.#onDidOpenTextDocumentHandler();
    this.#onDidChangeComponentFileHandler();
    this.#onDidDeleteFilesHandler();
    void this.#visibleTextEditorsHandler();
  }
}

export const componentManager = new ComponentManager();
