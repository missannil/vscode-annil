import { vscode } from "#deps";
import { getJsonDiagnosticInfo } from "../core/jsonValidator/diagnosticInfo.js";

function findObjectClosingLine(document: vscode.TextDocument, openingLine: number): number | undefined {
  let depth = 0;

  for (let lineNumber = openingLine; lineNumber < document.lineCount; lineNumber++) {
    const text = document.lineAt(lineNumber).text;
    for (const character of text) {
      if (character === "{") {
        depth++;
      } else if (character === "}") {
        if (depth === 0) return lineNumber;
        depth--;
        if (depth === 0) return lineNumber;
      }
    }
  }

  return undefined;
}

function findContainingObjectOpeningLine(document: vscode.TextDocument, propertyLine: number): number | undefined {
  for (let lineNumber = propertyLine - 1; lineNumber >= 0; lineNumber--) {
    if (document.lineAt(lineNumber).text.includes("{")) return lineNumber;
  }

  return undefined;
}

function findPreviousPropertyLine(
  document: vscode.TextDocument,
  openingLine: number,
  beforeLine: number,
): number | undefined {
  for (let lineNumber = beforeLine - 1; lineNumber > openingLine; lineNumber--) {
    if (document.lineAt(lineNumber).text.trim() !== "") return lineNumber;
  }

  return undefined;
}

/** 删除一行 JSON 属性，并在删除对象最后属性时同步移除前一属性的逗号。 */
function deleteJsonProperty(document: vscode.TextDocument, edit: vscode.WorkspaceEdit, lineNumber: number): void {
  const propertyLine = document.lineAt(lineNumber);
  const openingLine = findContainingObjectOpeningLine(document, lineNumber);
  const closingLine = openingLine === undefined ? undefined : findObjectClosingLine(document, openingLine);
  if (openingLine !== undefined && closingLine !== undefined && !propertyLine.text.trimEnd().endsWith(",")) {
    const previousPropertyLine = findPreviousPropertyLine(document, openingLine, lineNumber);
    if (previousPropertyLine !== undefined) {
      const previousLine = document.lineAt(previousPropertyLine);
      const commaIndex = previousLine.text.lastIndexOf(",");
      if (commaIndex !== -1 && previousLine.text.slice(commaIndex + 1).trim() === "") {
        edit.delete(
          document.uri,
          new vscode.Range(previousPropertyLine, commaIndex, previousPropertyLine, commaIndex + 1),
        );
      }
    }
  }
  edit.replace(document.uri, propertyLine.rangeIncludingLineBreak, "");
}

/** 将属性添加到对象末尾；新属性永不携带尾逗号。 */
function insertJsonProperty(
  document: vscode.TextDocument,
  edit: vscode.WorkspaceEdit,
  openingLine: number,
  property: string,
): void {
  const openingText = document.lineAt(openingLine).text;
  const indentation = openingText.match(/^\s*/)?.[0] ?? "";
  if (openingText.includes("{}")) {
    const trimmedOpeningText = openingText.trim();
    const trailingComma = trimmedOpeningText.endsWith(",") ? "," : "";
    const objectPrefix = trimmedOpeningText.replace(/\{\}\s*,?$/, "");
    edit.replace(
      document.uri,
      document.lineAt(openingLine).range,
      [
        `${indentation}${objectPrefix}{`,
        `${indentation}  ${property}`,
        `${indentation}}${trailingComma}`,
      ].join("\n"),
    );

    return;
  }

  const closingLine = findObjectClosingLine(document, openingLine);
  if (closingLine === undefined) return;
  const previousPropertyLine = findPreviousPropertyLine(document, openingLine, closingLine);
  if (previousPropertyLine !== undefined) {
    const previousLine = document.lineAt(previousPropertyLine);
    if (!previousLine.text.trimEnd().endsWith(",")) {
      edit.insert(document.uri, previousLine.range.end, ",");
    }
  }
  edit.insert(document.uri, document.lineAt(closingLine).range.start, `${indentation}  ${property}\n`);
}

function generateDeletePropertyCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
  title: string,
): vscode.CodeAction {
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();

  deleteJsonProperty(document, action.edit, diagnostic.range.start.line);

  return action;
}

/** “未知的导入”诊断的单项删除修复。 */
export function generateUnknownImportCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const importName = getJsonDiagnosticInfo(diagnostic).componentName;
  if (importName === undefined) return undefined;

  return generateDeletePropertyCodeAction(document, diagnostic, `移除 “${importName}”`);
}

/** “未知的占位组件”诊断的单项删除修复。 */
export function generateUnknownPlaceholderCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const placeholderName = getJsonDiagnosticInfo(diagnostic).componentName;
  if (placeholderName === undefined) return undefined;

  return generateDeletePropertyCodeAction(document, diagnostic, `移除未知占位组件 “${placeholderName}”`);
}

/** “缺少占位组件”诊断的单项插入修复。 */
export function generateMissingPlaceholderCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const componentName = getJsonDiagnosticInfo(diagnostic).componentName;
  if (componentName === undefined) return undefined;
  const action = new vscode.CodeAction(
    `添加缺失占位组件 "${componentName}"`,
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();

  // 查找 componentPlaceholder 是否已存在
  let placeholderLine: number | undefined;
  for (let i = 0; i < document.lineCount; i++) {
    if (document.lineAt(i).text.includes("\"componentPlaceholder\"")) {
      placeholderLine = i;
      break;
    }
  }

  if (placeholderLine !== undefined) {
    // componentPlaceholder 已存在，直接在其中插入占位属性
    insertJsonProperty(document, action.edit, placeholderLine, `"${componentName}": "view"`);
  } else {
    // componentPlaceholder 不存在，先创建该字段再包含占位属性；保持对象内容分行显示。
    insertJsonProperty(
      document,
      action.edit,
      0,
      `"componentPlaceholder": {\n    "${componentName}": "view"\n  }`,
    );
  }

  return action;
}

/** “缺少导入的组件”诊断的单项插入修复。 */
export function generateMissingImportCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const { componentName, expectImport } = getJsonDiagnosticInfo(diagnostic);
  if (componentName === undefined) return undefined;

  const componentPath = expectImport?.[componentName];
  if (typeof componentPath !== "string") return undefined;

  const action = new vscode.CodeAction(`添加缺失导入 “${componentName}”`, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  insertJsonProperty(document, action.edit, diagnostic.range.start.line, `"${componentName}": "${componentPath}"`);

  return action;
}

/** “无效的路径”诊断的单项替换修复。 */
export function generateInvalidPathCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const correctPath = getJsonDiagnosticInfo(diagnostic).correctPath;
  if (correctPath === undefined) return undefined;

  const action = new vscode.CodeAction(`修正导入路径为 “${correctPath}”`, vscode.CodeActionKind.QuickFix);
  action.diagnostics = [diagnostic];
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(document.uri, diagnostic.range, correctPath);

  return action;
}

/** “未知配置属性”诊断的单项删除修复。 */
export function generateUnknownConfigKeyCodeAction(
  document: vscode.TextDocument,
  diagnostic: vscode.Diagnostic,
): vscode.CodeAction | undefined {
  const key = getJsonDiagnosticInfo(diagnostic).configKey;
  if (key === undefined) return undefined;

  return generateDeletePropertyCodeAction(document, diagnostic, `移除未知配置项 “${key}”`);
}
