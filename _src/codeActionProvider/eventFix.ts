import { vscode } from "#deps";
import { CustomComponentDiagnosticCode } from "../core/wxmlValidator/customComponent/validateCustomComponent.js";

const EVENT_VALUE_MESSAGE = /^事件属性 "(.+)" 应绑定 "(.+)"$/;

/** 为事件绑定值诊断生成替换为契约值的 Quick Fix。 */
export function generateEventValueCodeActions(
  wxmlUri: vscode.Uri,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code !== CustomComponentDiagnosticCode.eventValueMismatch) return [];
  const match = EVENT_VALUE_MESSAGE.exec(diagnostic.message);
  if (match === null) return [];

  const [, attributeName, expectedValue] = match;
  const action = new vscode.CodeAction(
    `修复事件属性 “${attributeName}” 为 “${expectedValue}”`,
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(wxmlUri, diagnostic.range, expectedValue);

  return [action];
}
