import type { vscode } from "../exportVscode";
import { createComponent } from "./createComponent";
import { createPage } from "./createPage";

/**
 * 右键拓展
 * @param context 扩展上下文
 */
export function rightClickManager(context: vscode.ExtensionContext): void {
  // 添加建立组件的右键菜单
  context.subscriptions.push(createComponent());
  // 添加建立页面的右键菜单
  context.subscriptions.push(createPage());
}
