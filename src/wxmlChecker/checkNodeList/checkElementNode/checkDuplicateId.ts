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
  const elementId = element.attribs.id as string | undefined;
  if (elementId === undefined) return;
  else if (validateDuplicateId(elementId, startLine, checkContext)) {
    checkContext.saveElementId(elementId);
  }
}
