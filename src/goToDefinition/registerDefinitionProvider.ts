import * as vscode from "vscode";
import { getJsonConfig } from "./getJsonConfig";
import { getWxmlFsPath } from "./getWxmlFsPath";

// 跳转到对应组件的wxml文件
export function registerProviderOfGotoWxml(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDefinitionProvider({ pattern: "**/*.wxml" }, {
    provideDefinition: async (document, position) => {
      const cursorRange = document.getWordRangeAtPosition(position);
      if (!cursorRange) return null;
      const tagName = document.getText(cursorRange);
      const wxmlUri = document.uri;
      const jsonConfig = await getJsonConfig(wxmlUri);
      if (!jsonConfig) return null;
      const usingComponents = jsonConfig.usingComponents || {};
      if (tagName in usingComponents) {
        const configPath = usingComponents[tagName];
        const wxmlFsPath = await getWxmlFsPath(configPath, wxmlUri.fsPath);

        return new vscode.Location(vscode.Uri.file(wxmlFsPath), new vscode.Position(0, 0));
      }
    },
  });
  context.subscriptions.push(provider);
}
