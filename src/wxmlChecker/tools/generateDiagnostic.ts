/**
 * 生成诊断信息
 * 从元素节点开始的行号开始检测错误，逐个正则表达式匹配错误 并生成诊断信息
 * @param regExpList - 找到错误位置的正则表达式列表
 * @param errorMessage - 鼠标悬停时出现的错误信息
 * @param textlines - wxml 使用\n分割后的列表
 * @param elementStartLine - 元素节点的行号
 * @param fixCode - 修复代码信息（可选）通过 diagnostic.code 字段把正确的值带过去
 * @returns 生成的诊断信息
 * @throws 当正则表达式列表匹配不到错误时抛出错误
 */
import * as vscode from "vscode";

import type { DiagnosticMessage } from "../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { EXTENSION_NAME } from "../../utils/constants";
import type { PreConditionAttrName } from "../CheckContext";
import type { CommentStatus } from "../CheckContext/CommentManager";

// 扩展 vscode 模块的声明
declare module "vscode" {
  interface Diagnostic {
    info: {
      commentStatus?: CommentStatus;
      commentLocationIsHead?: boolean;
      fixCode?: string;
      replaceCode?: string;
      conditionState?: PreConditionAttrName;
    };
  }
}

export function generateDiagnostic(
  regExpList: RegExp[],
  errorMessage: DiagnosticMessage,
  textlines: string[],
  elementStartLine: number,
  info: vscode.Diagnostic["info"] = {},
): vscode.Diagnostic {
  // 从元素节点开始的行号开始检测错误
  for (let startLine = elementStartLine; startLine < textlines.length; startLine++) {
    const lineText = textlines[startLine];
    // 逐个正则表达式匹配错误
    for (const regExp of regExpList) {
      const errorValueMatch = lineText.match(regExp);
      // 匹配到错误
      if (errorValueMatch) {
        // 错误的起始字符和结束字符
        const startCharacter = assertNonNullable(errorValueMatch.index);
        const endCharacter = startCharacter + errorValueMatch[0].length;

        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(
            startLine,
            startCharacter,
            startLine,
            endCharacter,
          ),
          errorMessage,
          vscode.DiagnosticSeverity.Error,
        );
        diagnostic.source = EXTENSION_NAME;
        // 诊断信息中存储一些额外信息，用于修复程序
        diagnostic.info = info;

        return diagnostic;
      }
      continue;
    }
  }

  throw new Error(`${regExpList}匹配不到错误`);
}
