import * as vscode from "vscode";
import { createAnnilComponent } from "./createAnnilComponent";

export function createComponent(): vscode.Disposable {
  // 为工作区目录的右键菜单添加 `建立组件`功能选项
  return vscode.commands.registerCommand(
    "annil.createComponent",
    async (uri: vscode.Uri) => {
      await createAnnilComponent(uri, false);
    },
  );
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
