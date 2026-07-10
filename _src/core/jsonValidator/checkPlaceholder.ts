import { vscode } from "#deps";
import type { ComponentPlaceholder } from "../types/JsonFileInfo.js";
import { findErrMsgRange } from "./findErrMsgRange.js";
import { findKeyline } from "./findKeyline.js";

/**
 * 验证 componentPlaceholder 配置
 *
 * - 未知占位组件：placeholder 中有但 usingComponents 中不存在
 * - 缺少占位组件：usingComponents 中有但 placeholder 中不存在
 */
export function checkPlaceholder(
  componentPlaceholder: ComponentPlaceholder,
  usingComponentKeys: string[],
  textlines: string[],
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  // 拷贝一份，用于追踪哪些 usingComponents key 还没有 placeholder
  const remainingKeys = [...usingComponentKeys];

  // 检查 componentPlaceholder 中的每个 key
  for (const key of Object.keys(componentPlaceholder)) {
    const idx = remainingKeys.indexOf(key);
    if (idx !== -1) {
      // 合法的 placeholder，从待检查列表中移除
      remainingKeys.splice(idx, 1);
      continue;
    }
    // 未知的占位组件
    const startLine = findKeyline(textlines, "componentPlaceholder");
    const diagnostic = new vscode.Diagnostic(
      findErrMsgRange(key, textlines, startLine - 1),
      "未知的占位组件",
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = "vscode-annil";
    diagnostic.code = key;
    diagnosticList.push(diagnostic);
  }

  // 缺少占位组件：remainingKeys 中剩余的 key 没有对应的 placeholder
  for (const key of remainingKeys) {
    const diagnostic = new vscode.Diagnostic(
      findErrMsgRange("componentPlaceholder", textlines),
      "缺少占位组件",
      vscode.DiagnosticSeverity.Error,
    );
    diagnostic.source = "vscode-annil";
    diagnostic.code = key;
    diagnosticList.push(diagnostic);
  }

  return diagnosticList;
}
