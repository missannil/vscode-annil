import type { Element } from "domhandler";
import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../CheckContext";
import { generateDiagnostic } from "../../tools/generateDiagnostic";
import { regexpHelper } from "../../tools/regexpHelper";

/**
 * 验证元素的 id 是否重复
 */
function validateDuplicateId(
  elementId: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, existingIdList, diagnosticList } = checkContext;
  if (existingIdList.includes(elementId)) {
    diagnosticList.push(
      generateDiagnostic(
        regexpHelper.getFullAttrRegexp("id"),
        DiagnosticErrorType.duplicateId,
        textlines,
        startLine,
      ),
    );

    return false;
  }

  return true;
}

export function checkDuplicateId(
  element: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const rawId = element.attribs.id;
  if (rawId === undefined) return;
  // 在minitest测试框架获取元素时通过 *[id$='aaa'] 这样的选择器来获取元素的，所以要保证后面的aaa不可以重复。 在循环元素中id可能使用到变量，例如{{index}}_aaa,这时验证后面的aaa是否重复就好，连接符是_，所以先通过_分割再取最后一段来验证是否重复。
  const elementId = rawId.trim().split("_").slice(-1)[0];
  if (validateDuplicateId(elementId, startLine, checkContext)) {
    checkContext.saveElementId(elementId);
  }
}
