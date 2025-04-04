import * as vscode from "vscode";
import { registerProviderOfGotoWxml } from "./registerDefinitionProvider";

// 跳转到定义
export function goToDefinition(context: vscode.ExtensionContext): void {
  // 跳转到对应组件的wxml文件
  registerProviderOfGotoWxml(context);
}
