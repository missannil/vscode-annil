import type { JsonUri } from "../../componentManager/uriHelper";
import { vscode } from "../../exportVscode";
import type { JsonConfig } from "../../goToDefinition/getJsonConfig";

/**
 * 查找JSON对象的结束位置
 * @param text JSON文本
 * @param startPos 开始查找的位置
 * @returns 结束括号的位置
 */
function findJsonObjectEnd(text: string, startPos: number): number {
  let braceCount = 1;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === "\"" && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") braceCount++;
      if (char === "}") braceCount--;

      if (braceCount === 0) {
        return i;
      }
    }
  }

  return -1; // 未找到结束位置
}

/**
 * 计算文本中的行和列位置
 * @param text 完整文本
 * @param pos 字符位置
 * @returns 行和列位置
 */
function getLineAndChar(text: string, pos: number): { line: number; char: number } {
  const line = text.substring(0, pos).split("\n").length - 1;
  const char = text.substring(0, pos).split("\n").pop()?.length ?? 0;

  return { line, char };
}

/**
 * 转义正则表达式中的特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 把错误的路径替换为正确的路径
 * @param jsonUri
 * @param jsonText
 * @param incorrectPath
 * @param correctPath
 * @param codeAction
 */
export function generateInvalidPathAction(
  jsonUri: JsonUri,
  jsonText: string,
  incorrectPath: string,
  correctPath: string,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  // 创建 CodeAction
  codeAction = codeAction || new vscode.CodeAction(
    `替换路径: "${incorrectPath}" → "${correctPath}"`,
    vscode.CodeActionKind.QuickFix,
  );

  // 创建工作区编辑
  codeAction.edit = codeAction.edit || new vscode.WorkspaceEdit();

  try {
    // 解析JSON
    const config = JSON.parse(jsonText) as JsonConfig;

    // 检查是否存在 usingComponents 字段
    if (!("usingComponents" in config) || typeof config.usingComponents !== "object") {
      return codeAction; // 没有usingComponents，直接返回
    }

    // 找到 usingComponents 字段的位置
    const usingComponentsMatch = jsonText.match(/"usingComponents"\s*:\s*\{/);
    if (!usingComponentsMatch || usingComponentsMatch.index === undefined) {
      return codeAction;
    }

    const startPos = usingComponentsMatch.index + usingComponentsMatch[0].length;
    const endPos = findJsonObjectEnd(jsonText, startPos);

    if (endPos === -1) {
      return codeAction; // 未找到对象结束位置
    }

    // 在 usingComponents 内容中查找要替换的路径
    const usingComponentsContent = jsonText.substring(startPos, endPos);

    // 创建正则表达式来匹配路径部分
    // 匹配形如 "someKey": "incorrectPath" 的模式，捕获路径值
    const pathRegex = new RegExp(`(:\\s*)"${escapeRegExp(incorrectPath)}"`, "g");
    const match = pathRegex.exec(usingComponentsContent);

    if (!match) {
      return codeAction; // 未找到要替换的路径
    }

    const pathMatchIndex = match.index + match[1].length; // 路径值起始位置（包括引号）
    const pathStartPos = startPos + pathMatchIndex;
    const pathEndPos = pathStartPos + incorrectPath.length + 2; // +2 为两个引号

    // 计算行列位置
    const startPosition = getLineAndChar(jsonText, pathStartPos);
    const endPosition = getLineAndChar(jsonText, pathEndPos);

    // 创建替换范围（包括引号）
    const replaceRange = new vscode.Range(
      startPosition.line,
      startPosition.char,
      endPosition.line,
      endPosition.char,
    );

    // 替换为正确的路径（加上引号）
    codeAction.edit.replace(jsonUri, replaceRange, `"${correctPath}"`);
  } catch (error) {
    // 发生解析错误时，不执行任何编辑操作
    console.error("处理路径替换时发生错误:", error);
  }

  return codeAction;
}
