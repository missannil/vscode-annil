import type * as vscode from "vscode";
import type { JsonUri } from "../componentManager/isComponentUri";
import type { JsonFileInfo } from "../componentManager/jsonFileManager";
import { type TsFileInfo } from "../componentManager/tsFileManager";
import { diagnosticManager } from "../diagnosticManager";
class JsonChecker {
  public start(jsonUri: JsonUri, jsonFileInfo: JsonFileInfo, tsFileInfo: TsFileInfo): void {
    const diagnosticList: vscode.Diagnostic[] = [];
    // 和tsfileinfo比较看是否缺少导入的组件和多余的导入
    const useingComponents = jsonFileInfo.config.usingComponents;
    const tsComponents = tsFileInfo.subComponentInfo;
    // diagnosticManager.set(jsonUri, diagnosticList);
  }
}

export const jsonChecker = new JsonChecker();
