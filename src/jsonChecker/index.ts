import * as vscode from "vscode";
import type { JsonUri } from "../componentManager/isComponentUri";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { diagnosticManager } from "../diagnosticManager";
import { findDiffItems } from "../utils/findDiffItems";
class JsonChecker {
  // 用于存储检测完成后的回调函数
  #checkCompletedCallbacks: Record<string, undefined | ((diagnosticList: vscode.Diagnostic[]) => void)> = {};
  // 注册诊断完成后的回调函数,在进行拓展测试时会用到,记得要取消注册(deregisterCheckCompletedCallback)
  public registerCheckCompletedCallback(jsonUri: JsonUri, cb: (diagnosticList: vscode.Diagnostic[]) => void): void {
    this.#checkCompletedCallbacks[jsonUri.fsPath] = cb;
  }
  public deregisterCheckCompletedCallback(jsonUri: JsonUri): void {
    delete this.#checkCompletedCallbacks[jsonUri.fsPath];
  }

  /**
   * 检测json文件
   * 当前导入的组件和tsfileinfo中生成的预期导入对比,缺少或多余的导入都报错到第一行并加入到diagnosticManager
   * 检测是否有回调并运行(用于测试用例)
   * @param jsonUri
   * @param jsonFileInfo
   * @param tsFileInfo
   */
  public start(jsonUri: JsonUri, jsonFileInfo: JsonFileInfo, tsFileInfo: TsFileInfo): void {
    const diagnosticList: vscode.Diagnostic[] = [];
    // 和tsfileinfo比较看是否缺少导入的组件和多余的导入
    const currentImportedList = Object.keys(jsonFileInfo.config.usingComponents || {});
    const expectSubCompTypes = Object.keys(tsFileInfo.importedSubCompInfo);
    const missingImportList = findDiffItems(expectSubCompTypes, currentImportedList, "missing");
    if (missingImportList.length > 0) {
      const missingImportStr = missingImportList.join(",");
      // 找到"usingComponents"位置
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 10),
        `${DiagnosticErrorType.missingImport}:${missingImportStr}`,
        vscode.DiagnosticSeverity.Error,
      );
      // 把全部的importedSubCompInfo放到code里，方便后面的fix
      diagnostic.code = JSON.stringify(tsFileInfo.importedSubCompInfo);
      diagnosticList.push(diagnostic);
    }
    const unknownImportList = findDiffItems(expectSubCompTypes, currentImportedList, "extra");
    if (unknownImportList.length > 0) {
      const unknownImportStr = unknownImportList.join(",");
      // 找到"usingComponents"位置
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 10),
        `${DiagnosticErrorType.unknownImport}:${unknownImportStr}`,
        vscode.DiagnosticSeverity.Error,
      );
      // 把全部的importedSubCompInfo放到code里，方便后面的fix
      diagnostic.code = JSON.stringify(tsFileInfo.importedSubCompInfo);
      diagnosticList.push(diagnostic);
    }
    diagnosticManager.set(jsonUri, diagnosticList);
    const cb = this.#checkCompletedCallbacks[jsonUri.fsPath];
    cb && cb(diagnosticList);
  }
}

export const jsonChecker = new JsonChecker();
