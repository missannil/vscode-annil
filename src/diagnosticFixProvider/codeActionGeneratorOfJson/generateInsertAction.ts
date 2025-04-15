/* eslint-disable complexity */

import type { JsonUri } from "../../componentManager/uriHelper";
import { vscode } from "../../exportVscode";
import type { JsonConfig } from "../../goToDefinition/getJsonConfig";

type InsertKey = string;
type InsertValue = string;
type InsertConfig = [InsertKey, InsertValue];

export function generateInsertAction(
  jsonUri: JsonUri,
  jsonText: string,
  insertConfig: InsertConfig,
  fixName: string,
  property: string,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  const insertKey = insertConfig[0];
  const insertValue = insertConfig[1];
  codeAction = codeAction || new vscode.CodeAction(
    `${fixName}: ${insertKey}`,
    vscode.CodeActionKind.QuickFix,
  );
  // 创建工作区编辑
  codeAction.edit = codeAction.edit || new vscode.WorkspaceEdit();

  // 解析JSON以找到Property位置
  const config = JSON.parse(jsonText) as JsonConfig;

  // 检查是否存在Property字段
  const hasProperty = property in config;

  if (hasProperty) {
    // 找到Property字段的位置
    const propertyRegex = new RegExp(`"${property}"\\s*:\\s*\\{`);
    const propertyMatch = jsonText.match(propertyRegex);
    if (propertyMatch && propertyMatch.index !== undefined) {
      const startPos = propertyMatch.index + propertyMatch[0].length;

      // 找到Property对象的结尾括号
      let braceCount = 1;
      let endPos = startPos;
      let inString = false;
      let escapeNext = false;

      for (let i = startPos; i < jsonText.length; i++) {
        const char = jsonText[i];

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
            endPos = i;
            break;
          }
        }
      }

      // 检查Property字段是否为空
      const propertyContent = jsonText.substring(startPos, endPos).trim();
      const isEmpty = propertyContent.length === 0;

      // 准备插入的文本
      const prefix = isEmpty ? "" : ",";
      const indent = "\n    "; // 假设缩进为4个空格
      const insertText = `${prefix}${indent}"${insertKey}": "${insertValue}"`;

      // 在Property对象结尾插入缺失的导入
      codeAction.edit.insert(
        jsonUri,
        new vscode.Position(
          jsonText.substring(0, endPos).split("\n").length - 1,
          jsonText.substring(0, endPos).split("\n").pop()?.length ?? 0,
        ),
        insertText,
      );
    }
  } else {
    // 如果不存在Property字段，则添加整个字段
    // 找到合适的位置插入，假设在JSON的最后一个大括号前插入
    const lastBraceIndex = jsonText.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      const insertText = `,\n  ${property}: {\n    "${insertKey}": "${insertValue}"\n  }`;

      codeAction.edit.insert(
        jsonUri,
        new vscode.Position(
          jsonText.substring(0, lastBraceIndex).split("\n").length - 1,
          jsonText.substring(0, lastBraceIndex).split("\n").pop()?.length ?? 0,
        ),
        insertText,
      );
    }
  }

  return codeAction;
}
