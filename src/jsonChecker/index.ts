import * as vscode from "vscode";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";

import type { TsFileInfo } from "../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../diagnosticFixProvider/errorType";
import { EXTENSION_NAME } from "../utils/constants";
import { isDeepEqual } from "../utils/isDeepEqual";
type ComponentName = string;
type ComponentPath = string;
type UsingComponents = Record<ComponentName, ComponentPath>;
type ExpectImport = Record<ComponentName, ComponentPath | undefined>;

export class JsonChecker {
  #textlines!: string[];
  #legalConfigProperties = ["usingComponents", "component", "componentPlaceholder", "disableScroll"];
  private diagnosticList: vscode.Diagnostic[] = [];
  // json文件中usingComponents字段配置
  private jsonFileUsingComponents: UsingComponents;
  private findPropertyRange(key: string): vscode.Range {
    const line = this.#textlines.findIndex((item) => item.includes(key));
    if (line === -1) return new vscode.Range(0, 0, 0, 0);
    const start = this.#textlines[line].indexOf(key);
    const end = start + key.length;

    return new vscode.Range(line, start, line, end);
  }
  // 期望导入的组件配置
  private tsFileExpectImport: ExpectImport;

  private validateUnknownProperty(): void {
    const config = this.jsonFileInfo.config;
    Object.keys(config).forEach((key) => {
      if (!this.#legalConfigProperties.includes(key)) {
        this.diagnosticList.push(
          new vscode.Diagnostic(
            this.findPropertyRange(key),
            DiagnosticErrorType.unknownProperty,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    });
  }
  private validateUsingComponents(): void {
    const { jsonFileUsingComponents, tsFileExpectImport } = this;
    if (isDeepEqual(jsonFileUsingComponents, tsFileExpectImport)) return;
    const diagnostic = new vscode.Diagnostic(
      // (0, 0, 0, 10)表示第一行第一列到第一行第十列
      new vscode.Range(0, 0, 0, 10),
      DiagnosticErrorType.usingComponents,
      vscode.DiagnosticSeverity.Error,
    );
    // 把全部的importedSubCompInfo放到code里,方便生成修复Action时使用
    diagnostic.code = JSON.stringify(tsFileExpectImport);
    diagnostic.source = EXTENSION_NAME;
    this.diagnosticList.push(diagnostic);
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
    this.validateUsingComponents();
    this.validateUnknownProperty();

    return this.diagnosticList;
  }
  public constructor(
    private jsonFileInfo: JsonFileInfo,
    private wxmlCustomComponents: string[],
    private tsFileInfo: TsFileInfo,
  ) {
    this.jsonFileUsingComponents = this.jsonFileInfo.config.usingComponents ?? {};
    this.#textlines = this.jsonFileInfo.text.split(/\r?\n/);
    this.tsFileExpectImport = this.tsFileInfo.importedSubCompInfo;
  }
}
