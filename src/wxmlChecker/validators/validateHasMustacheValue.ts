import * as vscode from "vscode";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { getMustacheExpressions } from "../../utils/getMustacheExpressions";
import { generateDiagnostic } from "../tools/generateDiagnostic";

import { hasMustacheValue } from "../tools/hasMustacheValue";
import { regexpHelper } from "../tools/regexpHelper";

export function validateHasMustacheValue(
  rawAttrName: string,
  rawAttrValue: string,
  textlines: string[],
  startLine: number,
  diagnosticList: vscode.Diagnostic[],
  singleMustacheSyntaxConstraint: boolean = false,
  replaceCode: string = "",
): boolean {
  const has = hasMustacheValue(rawAttrValue);
  if (!has) {
    diagnosticList.push(generateDiagnostic(
      regexpHelper.getFullValueRegexp(rawAttrName, rawAttrValue),
      DiagnosticErrorType.notFoundMustacheSyntax,
      textlines,
      startLine,
      { replaceCode },
    ));

    return false;
  }
  const mustacheValues = getMustacheExpressions(rawAttrValue);
  if (singleMustacheSyntaxConstraint && mustacheValues.length > 1) {
    diagnosticList.push(generateDiagnostic(
      regexpHelper.getMustacheValue(rawAttrName, rawAttrValue),
      DiagnosticErrorType.singleMustacheSyntaxConstraint,
      textlines,
      startLine,
      { replaceCode },
    ));

    return false;
  }

  return true;
}
