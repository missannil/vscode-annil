import { vscode } from "#deps";
import { ConditionDiagnosticCode } from "../core/wxmlValidator/element/condition/conditionDiagnostics.js";

type IllegalElementIfInfo = {
  elementStart: number;
  elementEnd?: number;
  conditionValue: string;
};

/** 将元素上的 wx:if 移到外层 block。 */
export function generateElementConditionCodeActions(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction[] {
  if (diagnostic.code !== ConditionDiagnosticCode.illegalElementIf) return [];

  const info = getInfo(diagnostic);
  if (info === undefined || info.elementEnd === undefined || info.elementEnd <= info.elementStart) return [];

  const elementStart = document.positionAt(info.elementStart);
  const elementEnd = document.positionAt(info.elementEnd);
  const lineText = document.lineAt(elementStart.line).text;
  const indentation = lineText.slice(0, lineText.search(/\S|$/));
  const elementText = document
    .getText(new vscode.Range(elementStart, elementEnd))
    .replace(/\s+wx:if\s*=\s*(?:"[^"]*"|'[^']*')/, "");
  const opening = `<block wx:if="${info.conditionValue}">`;
  const innerIndentation = `${indentation}  `;
  const indentedElementText = elementText
    .split("\n")
    .map((line) => `${innerIndentation}${line}`)
    .join("\n");
  const replacement = `${opening}\n${indentedElementText}\n${indentation}</block>`;

  const action = new vscode.CodeAction(
    "将 wx:if 移到 block 包裹元素",
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, new vscode.Range(elementStart, elementEnd), replacement);

  return [action];
}

function getInfo(diagnostic: vscode.Diagnostic): IllegalElementIfInfo | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const info = (diagnostic as any).info as Partial<IllegalElementIfInfo> | undefined;
  if (
    info === undefined
    || typeof info.elementStart !== "number"
    || (info.elementEnd !== undefined && typeof info.elementEnd !== "number")
    || typeof info.conditionValue !== "string"
  ) return undefined;

  return info as IllegalElementIfInfo;
}
