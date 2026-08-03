import { vscode } from "#deps";
import { CommentDiagnosticCode } from "./diagnosticCodes.js";
import { generateDiagnostic } from "./generateDiagnostic.js";
import type { CommentType } from "./types.js";

/**
 * 验证全局注释 all 是否在文件头部
 * all 只能在文件头部（第一个元素节点出现前）使用
 *
 * @returns true 表示位置有效，false 表示已生成诊断
 */
export function validateGlobalCommentLocation(
  curCommentType: CommentType,
  curCommentText: string,
  startLine: number,
  isHeadLocation: boolean,
  diagnosticList: vscode.Diagnostic[],
  textlines: string[],
): boolean {
  if (curCommentType === "all" && !isHeadLocation) {
    diagnosticList.push(
      generateDiagnostic(
        [new RegExp(curCommentText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))],
        "注释应写在文件头部",
        textlines,
        startLine,
        {},
        CommentDiagnosticCode.invalidLocation,
      ),
    );

    return false;
  }

  return true;
}
