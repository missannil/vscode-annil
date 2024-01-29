import * as vscode from "vscode";
import { writeAttributeToWxml } from "./addAttributes";
import { getAttributesList } from "./getAttributesList";
import { getFileContentByfileName } from "./getFileContentByfileName";
import { isTSFile } from "./isTsFile";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("annil.auto-attribute", async () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    // 判断当前活动编辑器是否是ts文件
    if (activeTextEditor === undefined || !isTSFile(activeTextEditor)) return;
    // 获取同级路径下同名.wxml文件的路径
    const wxmlFileName = activeTextEditor.document.fileName.replace(".ts", ".wxml");
    // 获取同级路径下同名.wxml文件内容(字符串)
    const wxmlContentStr = await getFileContentByfileName(wxmlFileName);
    // 有wxml文件才继续执行
    if (wxmlContentStr !== false) {
      // 读取当前ts文件的内容(字符串)
      const tsContentStr = activeTextEditor.document.getText();
      // 获取ts文件所有SubComponent函数配置中的组件属性 attributesList 为对象key为组件名,值为组件的属性
      const attributesList = await getAttributesList(tsContentStr);
      // attributesList不为null,说明有属性可以添加
      if (attributesList !== null) {
        writeAttributeToWxml(wxmlContentStr, attributesList, wxmlFileName);
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
