import * as vscode from "vscode";
import { getSnippet } from "../snippets";

/**
 * 通用组件创建函数
 * @param uri 目标文件夹URI
 * @param isPage 是否为页面组件
 */
export async function createAnnilComponent(uri: vscode.Uri, isPage: boolean): Promise<void> {
  const fileName = uri.path.split("/").pop();
  if (fileName === undefined) {
    return;
  }
  const fileNameWithoutExt = fileName.split(".")[0];
  const componentType = isPage ? "页面" : "组件";

  const newFileName = await vscode.window.showInputBox({
    prompt: `请输入新${componentType}名称`,
    value: fileNameWithoutExt,
  });

  if (newFileName === undefined) {
    return;
  }

  // 新的目录名
  const newDirUri = vscode.Uri.joinPath(uri, `./${newFileName}`);
  // 创建目录
  await vscode.workspace.fs.createDirectory(newDirUri);

  // 在新目录下创建同目录名的四个文件
  const newTsFileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.ts`);
  const newJsonFileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.json`);
  const newWxmlFileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.wxml`);
  const newWxssFileUri = vscode.Uri.joinPath(newDirUri, `${newFileName}.wxss`);

  // 获取代码片段并处理代码片段中的变量(替换为用户输入的名称)

  const tsContent = processSnippet(getSnippet("typescript", isPage), newFileName);
  const jsonContent = getSnippet("json", isPage);
  const wxmlContent = getSnippet("wxml", isPage);
  const wxssContent = getSnippet("wxss", isPage);

  // 写入文件内容
  await vscode.workspace.fs.writeFile(newTsFileUri, Buffer.from(tsContent));
  await vscode.workspace.fs.writeFile(newJsonFileUri, Buffer.from(jsonContent));
  await vscode.workspace.fs.writeFile(newWxmlFileUri, Buffer.from(wxmlContent));
  await vscode.workspace.fs.writeFile(newWxssFileUri, Buffer.from(wxssContent));

  // 打开创建的文件
  void vscode.window.showTextDocument(newTsFileUri);
}

/**
 * 处理代码片段中的变量
 * @param snippet 代码片段
 * @param fileName 文件名
 */
export function processSnippet(snippet: string, fileName: string): string {
  // 处理空字符串情况
  if (!snippet) {
    return ""; // 返回空字符串，不添加换行符
  }
  try {
    const componentType = fileName.charAt(0).toUpperCase() + fileName.slice(1);
    // 把$1替换为用户输入的名称，$2替换为组件类型
    snippet = snippet.replace(/\$1/g, fileName);
    snippet = snippet.replace(/\$2/g, componentType);
    console.log("hry 1", snippet);
  } catch (error) {
    console.error("处理代码片段时出错:", error);
  }

  return snippet;
}
