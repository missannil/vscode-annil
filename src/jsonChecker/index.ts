import * as vscode from "vscode";
import { generateDiagnostic } from "../../src/wxmlChecker/generateDiagnostic";
import { rangeRegexp } from "../../src/wxmlChecker/rangeRegexp";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";

type ComponentName = string;
type ComponentPath = string;

type UsingComponents = Record<ComponentName, ComponentPath>;
type ExpectImport = Record<ComponentName, ComponentPath | undefined>;

export class JsonChecker {
  private diagnosticList: vscode.Diagnostic[] = [];
  // json文件中usingComponents字段配置
  private jsonFileUsingComponents: UsingComponents;
  // json文件中usingComponents字段配置的所有key
  private usingComponentsImported: string[];
  // 期望导入的组件配置
  private tsFileExpectImport: ExpectImport;
  //  期望导入的组件(从ts文件中获取)的所有key
  private expectImportComponentName: string[];

  // 检测缺少的导入,放在第一行上面长度为10的位置
  private missingImportCheck(): void {
    const missingImportList = this.expectImportComponentName.filter((item) =>
      !this.usingComponentsImported.includes(item)
    );
    if (missingImportList.length > 0) {
      const missingImportStr = missingImportList.join(",");
      const diagnostic = new vscode.Diagnostic(
        // (0, 0, 0, 10)表示第一行第一列到第一行第十列
        new vscode.Range(0, 0, 0, 10),
        `${DiagnosticErrorType.missingImport}:${missingImportStr}`,
        vscode.DiagnosticSeverity.Error,
      );
      // 把全部的importedSubCompInfo放到code里,方便生成修复Action时使用
      diagnostic.code = JSON.stringify(this.tsFileInfo.importedSubCompInfo);

      this.diagnosticList.push(diagnostic);
    }
  }

  private unknownImportCheck(): void {
    [...this.usingComponentsImported].forEach((importedComponentName) => {
      // 如果期望导入的组件配置中不包含当前导入的组件名,则说明导入了一个多余组件
      if (
        // 如果期望导入的组件配置中不包含当前导入的组件名
        !this.expectImportComponentName.includes(importedComponentName)
        // 并且当前导入的组件名不在wxml自定义组件中(这样可以忽略wxml中已经使用组件的导入报错)
        && !this.wxmlCustomComponents.includes(importedComponentName)
      ) {
        const diagnostic = generateDiagnostic(
          rangeRegexp.getImportLineRegexp(importedComponentName),
          `${DiagnosticErrorType.unknownImport}:${importedComponentName}`,
          this.jsonFileInfo.text.split("\n"),
          0,
          JSON.stringify(this.tsFileInfo.importedSubCompInfo),
        );

        this.diagnosticList.push(diagnostic);
      }
    });
  }
  // 错误的导入路径检测
  private errorImportPathCheck(): void {
    this.usingComponentsImported.forEach((importedComponentName) => {
      const expectImportPath = this.tsFileExpectImport[importedComponentName];
      if (expectImportPath === undefined) {
        return;
      }
      const realImportPath = this.jsonFileUsingComponents[importedComponentName];
      if (expectImportPath !== realImportPath) {
        const diagnostic = generateDiagnostic(
          rangeRegexp.getImportPathRegexp(importedComponentName, realImportPath),
          `${DiagnosticErrorType.errorImportPath}:${importedComponentName}`,
          this.jsonFileInfo.text.split("\n"),
          0,
          JSON.stringify(this.tsFileInfo.importedSubCompInfo),
        );

        this.diagnosticList.push(diagnostic);
      }
    });
  }
  /**
   * json文件检测器
   * 1. 检测缺少的导入
   * 2. 检测未知的导入
   * @param jsonUri
   * @param jsonFileInfo
   * @param tsFileInfo
   */
  public start(): vscode.Diagnostic[] {
    // 1 检测缺少的导入
    this.missingImportCheck();
    // 2 检测未知的导入
    this.unknownImportCheck();
    // 3. 错误的导入
    this.errorImportPathCheck();

    return this.diagnosticList;
  }
  public constructor(
    private jsonFileInfo: JsonFileInfo,
    private wxmlCustomComponents: string[],
    private tsFileInfo: TsFileInfo,
  ) {
    this.jsonFileUsingComponents = this.jsonFileInfo.config.usingComponents ?? {};
    this.usingComponentsImported = Object.keys(this.jsonFileUsingComponents);
    this.tsFileExpectImport = this.tsFileInfo.importedSubCompInfo;
    this.expectImportComponentName = Object.keys(this.tsFileExpectImport);
  }
}
