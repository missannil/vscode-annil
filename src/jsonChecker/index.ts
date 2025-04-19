import * as vscode from "vscode";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";

import type { ComponentInfo } from "../componentManager/tsFileManager/types";
import { checkPlaceholder } from "./checkPlaceholder";
import { validateInvalidPath } from "./validateInvalidPath";
import { validateMissingImports } from "./validateMissingImports";
import { validateUnknownImports } from "./validateUnknownImports";
import { validateUnknownProperty as validateUnknownKeys } from "./validateUnknownKeys";
type ComponentName = string;
type ComponentPath = string;
type UsingComponents = Record<ComponentName, ComponentPath>;

export type ExpectImport = Record<ComponentName, ComponentPath | undefined>;

// export class JsonChecker {
//   #textlines!: string[];
//   #legalConfigKeys = ["usingComponents", "component", "componentPlaceholder", "disableScroll"];
//   private diagnosticList: vscode.Diagnostic[] = [];
//   // json文件中usingComponents字段配置
//   private jsonFileUsingComponents: UsingComponents;
//   private jsonFileComponentPlaceholder: UsingComponents;

//   // 期望导入的组件配置
//   private tsFileExpectImport: ExpectImport;

//   /**
//    * json文件检测器
//    * 1. 检测缺少的导入
//    * 2. 检测未知的导入
//    * @param jsonUri
//    * @param jsonFileInfo
//    * @param tsFileInfo
//    */
//   public start(): vscode.Diagnostic[] {
//     this.validateUnknownProperty();
//     this.validateMissingImports();
//     const validImportKeys = this.validateUnknownImports();
//     this.validateInvalidPath(validImportKeys);
//     this.checkPlaceholder();

//     return this.diagnosticList;
//   }
//   public constructor(
//     private jsonFileInfo: JsonFileInfo,
//     private tsFileInfo: TsFileInfo,
//   ) {
//     this.jsonFileUsingComponents = this.jsonFileInfo.config.usingComponents ?? {};
//     this.jsonFileComponentPlaceholder = this.jsonFileInfo.config.componentPlaceholder ?? {};
//     this.#textlines = this.jsonFileInfo.text.split(/\r?\n/);
//     this.tsFileExpectImport = this.tsFileInfo.importedSubCompInfo;
//     const userConfigKeys = (vscode.workspace.getConfiguration("annil").get("jsonConfigKeys") ?? []) as string[];
//     this.#legalConfigKeys = [...this.#legalConfigKeys, ...userConfigKeys];
//   }
// }

export type JsonCheckContext = {
  jsonFileUsingComponents: UsingComponents;
  jsonFileComponentPlaceholder: UsingComponents;
  tsFileExpectImport: ExpectImport;
  textlines: string[];
  legalConfigKeys: string[];
  jsonFileInfo: JsonFileInfo;
  tsFileInfo: ComponentInfo;
  diagnosticList: vscode.Diagnostic[];
};

export function jsonChecker(
  jsonFileInfo: JsonFileInfo,
  tsFileInfo: ComponentInfo,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const config = jsonFileInfo.config;
  const textlines = jsonFileInfo.text.split(/\r?\n/);
  diagnosticList.push(...validateUnknownKeys(config, textlines));
  const usingComponents = config.usingComponents ?? {};
  const usingComponentsKeys = Object.keys(usingComponents);
  const importedSubCompInfo = tsFileInfo.importedSubCompInfo;
  diagnosticList.push(...validateMissingImports(usingComponentsKeys, importedSubCompInfo, textlines));
  const result = validateUnknownImports(usingComponentsKeys, importedSubCompInfo, textlines);
  diagnosticList.push(...result.diagnosticList);
  diagnosticList.push(...validateInvalidPath(usingComponents, importedSubCompInfo, result.validImportKeys, textlines));

  const componentPlaceholder = jsonFileInfo.config.componentPlaceholder ?? {};
  diagnosticList.push(...checkPlaceholder(componentPlaceholder, usingComponentsKeys, textlines));

  return diagnosticList;
}
