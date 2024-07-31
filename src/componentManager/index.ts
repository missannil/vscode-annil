import * as vscode from "vscode";

import { diagnosticManager } from "../diagnosticManager";
import { jsonChecker } from "../jsonChecker";
import { debounce } from "../utils/debounce";
import { WxmlChecker } from "../wxmlChecker";
import { jsonFileManager } from "./jsonFileManager";
import { type TsFileInfo, tsFileManager } from "./tsFileManager";
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
  public deregisterCheckedCallback(fsPath: JsonFsPath | WxmlFsPath): void {
    delete this.#checkedCallbacks[fsPath];
  }
  // 组件是否正在检测(如果在检测队列中,则返回true表示正在检测)
  private isChecking(componentDirPath: ComponentDirPath): boolean {
    return this.#checkingQueue.includes(componentDirPath);
  }
  // 组件是否需要检测(如果是组件,并且没有诊断过(没有诊断信息),并且不在检测队列中,则返回true表示需要检测) 避免重复检测
  private isComponentNeedCheck(uri: vscode.Uri): uri is ComponentUri {
    return uriHelper.isComponentUri(uri) && !diagnosticManager.hasChecked(uriHelper.getComponentDirPath(uri))
      && !this.isChecking(uriHelper.getComponentDirPath(uri));
  }
  // 将组件目录路径加入检测队列
  public addCheckingQueue(componentDirPath: ComponentDirPath): void {
    this.#checkingQueue.push(componentDirPath);
  }
  // 将组件目录路径从检测队列中移除
  public removeCheckingQueue(componentDirPath: ComponentDirPath): void {
    const index = this.#checkingQueue.indexOf(componentDirPath);
    if (index !== -1) {
      this.#checkingQueue.splice(index, 1);
    } else {
      throw new Error("检测列表中没有这个文件");
    }
  }
  // 在激活插件时,检测当前打开的文本编辑器,如果是组件文件,则检测组件文件
  private async visibleTextEditorsHandler(): Promise<void> {
    const visibleTextEditors = vscode.window.visibleTextEditors;
    for (const textEditor of visibleTextEditors) {
      await this.onOpenTextEditor(textEditor.document.uri);
    }
  }
  // 监听删除组件文件时,删除组件文件的诊断信息
  private onDeleteComponentFileHandler(): void {
    vscode.workspace.onDidDeleteFiles(async (event) => {
      event.files.forEach((uri) => {
        if (uriHelper.isComponentUri(uri)) {
          const componentDirPath = uriHelper.getComponentDirPath(uri);
          this.removeCheckingQueue(componentDirPath);
          diagnosticManager.removeChecked(componentDirPath);
          diagnosticManager.delete(uriHelper.getSiblingUri(uri, ".json"));
          diagnosticManager.delete(uriHelper.getSiblingUri(uri, ".wxml"));
        }
      });
    });
  }
  // 组件文件内容变化时,重新检测组件文件
  private onDidChangeComponentFileHandler(): void {
    const debounceWxmlHandler = debounce(async (wxmlUri: WxmlUri) => {
      await this.checkWxmlFile(wxmlUri);
    }, 100);
    const debounceJsonHandler = debounce(async (jsonUri: JsonUri) => {
      await this.checkJsonFile(jsonUri);
    }, 100);
    const debounceCheckComopnentHandler = debounce(async (tsUri: TsUri, tsFileInfo: TsFileInfo) => {
      const wxmlUri = uriHelper.getSiblingUri(tsUri, ".wxml");
      await this.checkWxmlFile(wxmlUri, tsFileInfo);
      const jsonUri = uriHelper.getSiblingUri(tsUri, ".json");
      await this.checkJsonFile(jsonUri, tsFileInfo);
    }, 100);
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      // 如果没有内容变化,则不处理(比如只是保存文件,但是文件内容没有变化)
      if (event.contentChanges.length === 0) return;
      const textDocument = event.document;
      const uri = textDocument.uri;
      const text = textDocument.getText();
      if (uriHelper.isComponentUri(uri)) {
        if (uriHelper.isWxmlFile(uri)) {
          await wxmlFileManager.update(uri, text);
          debounceWxmlHandler.call(this, uri);
        } else if (uriHelper.isJsonFile(uri)) {
          await jsonFileManager.update(uri, text);
          debounceJsonHandler.call(this, uri);
        } else {
          const tsFileInfo = await tsFileManager.update(uri, text);
          debounceCheckComopnentHandler.call(this, uri, tsFileInfo);
        }
      }
    });
  }
  // 检测wxml文件,如果有回调函数,则执行回调函数(为了测试)
  private async checkWxmlFile(wxmlUri: WxmlUri, tsFileInfo?: TsFileInfo): Promise<void> {
    if (!tsFileInfo) {
      tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(wxmlUri, ".ts"));
    }
    const wxmlFileInfo = await wxmlFileManager.get(wxmlUri);
    const checker = new WxmlChecker();
    const diagnosticList = checker.start(wxmlFileInfo, tsFileInfo);
    // 删除原有的诊断信息
    diagnosticManager.delete(wxmlUri);
    diagnosticManager.set(wxmlUri, diagnosticList);
    // 为了测试
    const wxmlFsPath = uriHelper.getWxmlFsPath(wxmlUri);
    const wxmlCb = this.#checkedCallbacks[wxmlFsPath];
    wxmlCb && wxmlCb(diagnosticList);
  }
  // 检测json文件,如果有回调函数,则执行回调函数(为了测试)
  private async checkJsonFile(jsonUri: JsonUri, tsFileInfo?: TsFileInfo): Promise<void> {
    if (!tsFileInfo) {
      tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(jsonUri, ".ts"));
    }
    const jsonFileInfo = await jsonFileManager.get(jsonUri);
    const diagnosticList = jsonChecker.start(jsonFileInfo, tsFileInfo);
    diagnosticManager.delete(jsonUri);
    diagnosticManager.set(jsonUri, diagnosticList);
    // 为了测试
    const jsonFsPath = uriHelper.getJsonFsPath(jsonUri);
    const jsonCb = this.#checkedCallbacks[jsonFsPath];
    jsonCb && jsonCb(diagnosticList);
  }

  /**
   * 当打开一个文本编辑器时
   * 1. 检测uri是否需要检测,如果不需要检测,则无操作。
   * 2. 获取组件目录路径,作为检测队列的key,加入检测队列(避免重复检测)
   * 3. 检测组件的json文件和wxml文件错误
   * 4. 添加到已检测列表
   * 5. 从检测队列中移除
   * @param uri
   */
  private async onOpenTextEditor(uri: vscode.Uri): Promise<void> {
    if (this.isComponentNeedCheck(uri)) {
      const componentDirPath = uriHelper.getComponentDirPath(uri);
      this.addCheckingQueue(componentDirPath);
      const tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(uri, ".ts"));
      const jsonUri = uriHelper.getSiblingUri(uri, ".json");
      await this.checkJsonFile(jsonUri, tsFileInfo);
      const wxmlUri = uriHelper.getSiblingUri(uri, ".wxml");
      await this.checkWxmlFile(wxmlUri, tsFileInfo);
      diagnosticManager.addChecked(componentDirPath);
      this.removeCheckingQueue(componentDirPath);
    } else {
      // console.log("不需要检测", componentDirPath);
    }
  }
  private onDidOpenComponentFileHandler(): void {
    vscode.workspace.onDidOpenTextDocument(async (textDocument) => {
      await this.onOpenTextEditor(textDocument.uri);
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
