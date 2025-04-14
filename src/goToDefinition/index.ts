import * as vscode from "vscode";
// import { registerProviderOfGotoWxml } from "./registerDefinitionProvider";
import { registerProviderOfGotoUseLocation } from "./registerProviderOfGotoUseLocation";

// 跳转到定义
export function goToDefinition(context: vscode.ExtensionContext): void {
  // 跳转到对应组件的wxml文件
  // registerProviderOfGotoWxml(context);
  // 跳转到组件对应的配置文件
  registerProviderOfGotoUseLocation(context);
}
