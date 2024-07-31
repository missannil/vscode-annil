import * as vscode from "vscode";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
class JsonChecker {
  private findDiffItems(originalList: string[], currentList: string[], match: "missing" | "extra"): string[] {
    const originalSet = new Set(originalList);
    const currentSet = new Set(currentList);

    if (match === "missing") {
      return originalList.filter((item) => !currentSet.has(item));
    }
    if (match === "extra") {
      return currentList.filter((item) => !originalSet.has(item));
    }

    throw new Error("findDiffItems函数不存在这种情况");
  }
  private missingImportCheck(
    tsFileInfo: TsFileInfo,
    currentImportedList: string[],
    expectSubCompTypes: string[],
  ): vscode.Diagnostic | undefined {
    const missingImportList = this.findDiffItems(expectSubCompTypes, currentImportedList, "missing");
    if (missingImportList.length > 0) {
      const missingImportStr = missingImportList.join(",");
      const diagnostic = new vscode.Diagnostic(
        // (0, 0, 0, 10)表示第一行第一列到第一行第十列
        new vscode.Range(0, 0, 0, 10),
        `${DiagnosticErrorType.missingImport}:${missingImportStr}`,
        vscode.DiagnosticSeverity.Error,
      );
      // 把全部的importedSubCompInfo放到code里,方便生成修复Action时使用
      diagnostic.code = JSON.stringify(tsFileInfo.importedSubCompInfo);

      return diagnostic;
    }
  }

  private extraImportCheck(
    tsFileInfo: TsFileInfo,
    currentImportedList: string[],
    expectSubCompTypes: string[],
  ): vscode.Diagnostic | undefined {
    const unknownImportList = this.findDiffItems(expectSubCompTypes, currentImportedList, "extra");
    if (unknownImportList.length > 0) {
      const unknownImportStr = unknownImportList.join(",");
      // 找到"usingComponents"位置
      const diagnostic = new vscode.Diagnostic(
        // (0, 0, 0, 10)表示第一行第一列到第一行第十列
        new vscode.Range(0, 0, 0, 10),
        `${DiagnosticErrorType.unknownImport}:${unknownImportStr}`,
        vscode.DiagnosticSeverity.Error,
      );
      // 把全部的importedSubCompInfo放到code里,方便生成修复Action时使用
      diagnostic.code = JSON.stringify(tsFileInfo.importedSubCompInfo);

      return diagnostic;
    }
  }
  /**
   * json文件检测器
   * 1. 检测是否有缺少的导入
   * 2. 检测是否有多余的导入
   * 3. 加入到诊断列表中
   * 4. 检测是否有回调并运行(用于测试用例)
   * @param jsonUri
   * @param jsonFileInfo
   * @param tsFileInfo
   */
  public start(jsonFileInfo: JsonFileInfo, tsFileInfo: TsFileInfo): vscode.Diagnostic[] {
    const diagnosticList: vscode.Diagnostic[] = [];
    // 当前json文件中已经导入的组件
    const currentImportedList = Object.keys(jsonFileInfo.config.usingComponents ?? {});
    // 期望导入的组件(从ts文件中获取)
    const expectSubCompTypes = Object.keys(tsFileInfo.importedSubCompInfo);
    // 1 检测是否有缺少的导入
    const missingImportDiagnostic = this.missingImportCheck(
      tsFileInfo,
      currentImportedList,
      expectSubCompTypes,
    );
    missingImportDiagnostic && diagnosticList.push(missingImportDiagnostic);
    // 2 检测是否有多余的导入
    const extraImportDiagnostic = this.extraImportCheck(tsFileInfo, currentImportedList, expectSubCompTypes);
    extraImportDiagnostic && diagnosticList.push(extraImportDiagnostic);

    return diagnosticList;
  }
}

export const jsonChecker = new JsonChecker();
