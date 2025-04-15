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
 *  生成删除未知导入的 CodeAction
 * 实例中 aaa、bbb、ccc 是未知导入
 * ```json
 * {
   "component": true,
   "property": {
	"aaa": "/mockComponents/subA",
	"bbb": "/mockComponents/subB",
	"ccc": "/mockComponents/subA"
   }
 }
 * ```
 * @param jsonUri
 * @param jsonText
 * @param unknownKey
 * @param codeAction
 * @returns
 */
// eslint-disable-next-line complexity
export function generateDeleteKeyAction(
  jsonUri: JsonUri,
  jsonText: string,
  unknownKey: string,
  property: string,
  codeAction?: vscode.CodeAction,
): vscode.CodeAction {
  // 创建 CodeAction
  codeAction = codeAction || new vscode.CodeAction(
    `移除 "${unknownKey}"`,
    vscode.CodeActionKind.QuickFix,
  );

  // 创建工作区编辑
  codeAction.edit = codeAction.edit || new vscode.WorkspaceEdit();

  try {
    // 解析JSON
    const config = JSON.parse(jsonText) as JsonConfig;

    // 检查是否存在 property 字段
    // @ts-ignore
    if (!(property in config) || typeof config[property] !== "object") {
      return codeAction; // 没有property，直接返回
    }

    // 找到 property 字段的位置
    const propertyRegex = new RegExp(`"${property}"\\s*:\\s*\\{`);
    const propertyMatch = jsonText.match(propertyRegex);
    if (!propertyMatch || propertyMatch.index === undefined) {
      return codeAction;
    }

    const startPos = propertyMatch.index + propertyMatch[0].length;
    const endPos = findJsonObjectEnd(jsonText, startPos);

    if (endPos === -1) {
      return codeAction; // 未找到对象结束位置
    }

    // 在 property 内容中查找要删除的 key
    const propertyContent = jsonText.substring(startPos, endPos);

    // 创建正则表达式来匹配完整的键值对
    const keyRegex = new RegExp(`\\s*"${unknownKey}"\\s*:\\s*"[^"]*"\\s*,?`, "g");
    const match = keyRegex.exec(propertyContent);

    if (!match) {
      return codeAction; // 未找到要删除的键
    }

    const keyStartPos = startPos + match.index;
    const keyEndPos = keyStartPos + match[0].length;
    const matchedText = match[0];

    // 分析属性位置和逗号情况
    const endsWithComma = matchedText.trim().endsWith(",");
    const afterText = propertyContent.substring(match.index + match[0].length).trim();
    const isLastProperty = afterText === "" || afterText.startsWith("}");
    const beforeText = propertyContent.substring(0, match.index).trim();
    const hasPreviousProperty = beforeText.length > 0 && !beforeText.endsWith("{");

    // 创建要删除的范围
    const startPosition = getLineAndChar(jsonText, keyStartPos);
    const endPosition = getLineAndChar(jsonText, keyEndPos);
    const deleteRange = new vscode.Range(
      startPosition.line,
      startPosition.char,
      endPosition.line,
      endPosition.char,
    );

    // 删除未知导入的键值对
    codeAction.edit.delete(jsonUri, deleteRange);

    // 处理逗号问题
    handleCommaIssues(
      jsonText,
      jsonUri,
      codeAction.edit,
      keyStartPos,
      keyEndPos,
      isLastProperty,
      hasPreviousProperty,
      endsWithComma,
    );
  } catch (error) {
    // 发生解析错误时，不执行任何编辑操作
    console.error("处理未知导入时发生错误:", error);
  }

  return codeAction;
}

/**
 * 处理属性删除后的逗号问题
 */
function handleCommaIssues(
  jsonText: string,
  jsonUri: JsonUri,
  edit: vscode.WorkspaceEdit,
  keyStartPos: number,
  keyEndPos: number,
  isLastProperty: boolean,
  hasPreviousProperty: boolean,
  endsWithComma: boolean,
): void {
  if (isLastProperty && hasPreviousProperty) {
    // 删除的是最后一个属性，处理前一个属性的逗号
    removePreviousCommaIfNeeded(jsonText, jsonUri, edit, keyStartPos);
  } else if (!isLastProperty && !endsWithComma) {
    // 删除的不是最后一个属性且没有逗号，需要添加逗号
    addCommaForNextProperty(jsonText, jsonUri, edit, keyEndPos);
  }
}

/**
 * 如果前一个属性有逗号，删除它
 */
function removePreviousCommaIfNeeded(
  jsonText: string,
  jsonUri: JsonUri,
  edit: vscode.WorkspaceEdit,
  keyStartPos: number,
): void {
  // 查找前一个属性的结尾处
  let previousPropertyEndIndex = keyStartPos - 1;
  // 回退跳过空白字符
  while (
    previousPropertyEndIndex >= 0
    && /\s/.test(jsonText[previousPropertyEndIndex])
  ) {
    previousPropertyEndIndex--;
  }

  // 如果前一个属性以逗号结尾，需要删除这个逗号
  if (previousPropertyEndIndex >= 0 && jsonText[previousPropertyEndIndex] === ",") {
    const position = getLineAndChar(jsonText, previousPropertyEndIndex);
    edit.delete(
      jsonUri,
      new vscode.Range(
        position.line,
        position.char,
        position.line,
        position.char + 1,
      ),
    );
  }
}

/**
 * 为下一个属性添加逗号
 */
function addCommaForNextProperty(
  jsonText: string,
  jsonUri: JsonUri,
  edit: vscode.WorkspaceEdit,
  keyEndPos: number,
): void {
  const position = getLineAndChar(jsonText, keyEndPos);
  edit.insert(jsonUri, new vscode.Position(position.line, position.char), ",");
}
