import type { Element } from "domhandler";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";

import type { CheckContext } from "../../../CheckContext";
import { generateDiagnostic } from "../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../tools/regexpHelper";

export function validateRepeatSubComponentTag(
  elementNode: Element,
  tagMark: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { repeatTagStatus, diagnosticList, textlines } = checkContext;
  if (!checkContext.isCheckedSubComponentTag(tagMark) || repeatTagStatus) return true;
  diagnosticList.push(
    generateDiagnostic(
      regexpHelper.getTagNameRegexp(elementNode.name),
      DiagnosticErrorType.repeatedSubComponentTag,
      textlines,
      startLine,
    ),
  );

  return false;
}
