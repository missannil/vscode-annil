import * as vscode from "vscode";
import type { WxmlUri } from "../componentManager/isComponentUri";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { type WxmlFileInfo } from "../componentManager/wxmlFileManager";
import { diagnosticManager } from "../diagnosticManager";
import { Checker } from "./checker";

class WxmlChecker {
  // 用于存储检测完成后的回调函数
  #checkCompletedCallbacks: Record<string, undefined | ((diagnosticList: vscode.Diagnostic[]) => void)> = {};
  // 注册诊断完成后的回调函数,在进行拓展测试时会用到,记得要取消注册(deregisterCheckCompletedCallback)
  public registerCheckCompletedCallback(wxmlFsPath: string, cb: (diagnosticList: vscode.Diagnostic[]) => void): void {
    this.#checkCompletedCallbacks[wxmlFsPath] = cb;
  }
  public deregisterCheckCompletedCallback(wxmlFsPath: string): void {
    delete this.#checkCompletedCallbacks[wxmlFsPath];
  }
  public start(wxmlUri: WxmlUri, wxmlFileInfo: WxmlFileInfo, tsFileInfo: TsFileInfo): void {
    // console.log('开启检测', wxmlUri.fsPath)
    // const wxmlFileInfo = await wxmlFileManager.get(wxmlUri.fsPath);
    const wxmlDocument = wxmlFileInfo.wxmlDocument;
    // 这是为了后面手动找到错误位置(行号,开始索引,列号,结束索引),因为解析器(htmlparser2只有startIndex,endIndex,没有position信息)
    const wxmlTextlines = wxmlFileInfo.text.split(/\n/);
    // const tsFileInfo = await tsFileManager.get(getSiblingUri(wxmlUri, ".ts").fsPath);
    // 记录已经检查过的自定义标签名称,为了最后检查是否有有缺少的自定义组件
    const checker = new Checker(
      wxmlDocument.children,
      wxmlTextlines,
      tsFileInfo,
    );
    const diagnosticList: vscode.Diagnostic[] = checker.start();
    // console.log("诊断列表", diagnosticList);
    diagnosticManager.set(wxmlUri, diagnosticList);
    const cb = this.#checkCompletedCallbacks[wxmlUri.fsPath];
    cb && cb(diagnosticList);
  }
}

export const wxmlChecker = new WxmlChecker();
