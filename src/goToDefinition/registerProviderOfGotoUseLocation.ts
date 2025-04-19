import * as vscode from "vscode";
import { tsFileManager } from "../componentManager/tsFileManager";
import { uriHelper } from "../componentManager/uriHelper";

/**
 *  跳转到组件配置文件位置
 * 比如说在wxml中使用了<topNav />标签，点击跳转到 写有 const useTopNav = CustomComponent<RootType, $TopNav>()({...})的文件
 * @param context
 */
export function registerProviderOfGotoUseLocation(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDefinitionProvider({ pattern: "**/*.wxml" }, {
    provideDefinition: async (document, position) => {
      const cursorRange = document.getWordRangeAtPosition(position);
      if (!cursorRange) return null;
      const tagName = document.getText(cursorRange);
      const wxmlUri = document.uri;
      if (!uriHelper.isComponentUri(wxmlUri)) return null;
      const tsFileInfo = await tsFileManager.get(uriHelper.getSiblingUri(wxmlUri, ".ts"));
      const locationInfo = tsFileInfo.customComponentInfos[tagName] || tsFileInfo.chunkComponentInfos[tagName];
      if (!locationInfo) return null;
      const { fsPath, line } = locationInfo;

      const tsPosition = new vscode.Position(line - 1, 0);
      const tsUri = vscode.Uri.file(fsPath);

      // 只返回位置信息，不要主动打开文档或设置光标
      return new vscode.Location(tsUri, tsPosition);
    },
  });

  context.subscriptions.push(provider);
}
