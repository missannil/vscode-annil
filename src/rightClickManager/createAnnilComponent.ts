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

  // 获取代码片段并处理变量
  const variables = { name: newFileName };
  const tsContent = processSnippet(getSnippet("typescript", isPage), variables);
  const jsonContent = processSnippet(getSnippet("json", isPage), variables);
  const wxmlContent = processSnippet(getSnippet("wxml", isPage), variables);
  const wxssContent = processSnippet(getSnippet("wxss", isPage), variables);

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
 * @param variables 变量表
 */
export function processSnippet(snippet: string, variables: Record<string, string>): string {
  // 处理空字符串情况
  if (!snippet) {
    return ""; // 返回空字符串，不添加换行符
  }

  let result = snippet;
  // 替换用户定义的变量
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
  }

  // 移除VSCode特殊占位符，如$0、$1等
  result = result.replace(/\$\d+/g, "");

  // 确保非空内容的文件以单个换行符结束
  if (result.trim() && !result.endsWith("\n")) {
    result += "\n";
  } else if (result.trim() && result.endsWith("\n\n")) {
    // 如果有多个换行符，只保留一个
    result = result.replace(/\n+$/, "\n");
  }

  return result;
}
