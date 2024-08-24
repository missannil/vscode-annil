import * as vscode from "vscode";

import { diagnosticManager } from "../diagnosticManager";
import { JsonChecker } from "../jsonChecker";
import { assertNonNullable } from "../utils/assertNonNullable";
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
      // vscode 1.92.0版本event内uri的schema为file,无法判断是文件还是文件夹,所以只能通过文件路径判断,有缺陷(比如文件夹名字中包含 . 时)。
      for (const uri of event.files) {
        // 获取文件夹路径
        const dirPath = uriHelper.getComponentDirPath(uri as ComponentUri);
        // 删除检测过的缓存记录,再新建立同名组件后,确保可以重新检测。
        const arr = uri.path.split("/");
        const lastName = assertNonNullable(arr.pop());
        if (lastName.includes(".")) {
          // console.log("删除的是文件", uri.path);
          if (uriHelper.isComponentUri(uri)) {
            // console.log("删除组件文件", uri.path);
            // 删除检测过的缓存记录,再新建立同名组件后,确保可以重新检测。
            diagnosticManager.removeChecked(dirPath);
            // 删除组件的诊断信息
            diagnosticManager.delete(uriHelper.getSiblingUri(uri, ".json"));
            diagnosticManager.delete(uriHelper.getSiblingUri(uri, ".wxml"));
          } else {
            // console.log("删除的不是组件文件", uri.path);
          }
        } else {
          diagnosticManager.removeChecked(dirPath);
          // console.log("删除文件夹", uri.path);
          // 认为是文件夹,删除文件夹下的以index命名的诊断信息
          diagnosticManager.delete(vscode.Uri.joinPath(uri, "index.json"));
          diagnosticManager.delete(vscode.Uri.joinPath(uri, "index.wxml"));
          // 删除同组件目录名命名的组件诊断信息
          diagnosticManager.delete(vscode.Uri.joinPath(uri, `${lastName}.json`));
          diagnosticManager.delete(vscode.Uri.joinPath(uri, `${lastName}.wxml`));
        }
      }
    });
  }
  // 组件文件内容变化时,重新检测组件文件
  private onDidChangeComponentFileHandler(): void {
    const debounceWxmlHandler = debounce(async (wxmlUri: WxmlUri) => {
      // wxml文件变化时,检测wxml文件,并检测json文件(因为json检测时依赖wxml文件,所以wxml文件变化时,需要检测json文件)
      await this.checkWxmlFile(wxmlUri);
      await this.checkJsonFile(uriHelper.getSiblingUri(wxmlUri, ".json"));
    }, 100);
    const debounceJsonHandler = debounce(async (jsonUri: JsonUri) => {
      // json文件变化时,只检测json文件
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
    const checker = new WxmlChecker(wxmlFileInfo, tsFileInfo);
    const diagnosticList = checker.start();
    // 删除原有的诊断信息
    diagnosticManager.delete(wxmlUri);
    diagnosticManager.set(wxmlUri, diagnosticList);
    // 为了测试
    const wxmlFsPath = uriHelper.getWxmlFsPath(wxmlUri);
    const wxmlCb = this.#checkedCallbacks[wxmlFsPath];
    wxmlCb && wxmlCb(diagnosticList);
  }
  // 检测json文件,如果有回调函数,则执行回调函数(为了测试)
  private async checkJsonFile(
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
      const wxmlUri = uriHelper.getSiblingUri(uri, ".wxml");
      await this.checkWxmlFile(wxmlUri, tsFileInfo);
      const jsonUri = uriHelper.getSiblingUri(uri, ".json");
      await this.checkJsonFile(jsonUri, tsFileInfo);

      diagnosticManager.addChecked(componentDirPath);
      this.removeCheckingQueue(componentDirPath);
    } else {
      // console.log("不需要检测");
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
