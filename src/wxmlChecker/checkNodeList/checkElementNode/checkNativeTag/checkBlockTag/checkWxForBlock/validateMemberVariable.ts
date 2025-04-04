import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../../../../CheckContext";
import { getMemberExpressions } from "../../../../../tools/getMemberExpressions";
import { regexpHelper } from "../../../../../tools/regexpHelper";
import { validateVariableSyntax } from "../../../../../validators/validateVariableSyntax";
import { validateVariableValidity } from "../../../../../validators/validateVariableValidity";

export function validateMemberVariable(
  value: string,
  startLine: number,
  checkContext: CheckContext,
  attrName: string,
): boolean {
  const { textlines, diagnosticList, wxForInfos } = checkContext;
  const allMemberVariables = getMemberExpressions(value);

  return allMemberVariables.reduce((acc, memberVariable, index) => {
    // 第一个变量 验证语法和有效性
    if (index === 0) {
      return validateVariableSyntax(
        memberVariable,
        textlines,
        startLine,
        diagnosticList,
        regexpHelper.getFullMustacheValue(attrName, memberVariable),
      ) && validateVariableValidity(
        memberVariable,
        wxForInfos.itemNames,
        textlines,
        startLine,
        diagnosticList,
        DiagnosticErrorType.nonWxforItemVariable,
        regexpHelper.getFullMustacheValue(attrName, memberVariable),
      ) && acc;
    } else {
      // 其余变量只验证语法
      return validateVariableSyntax(
        memberVariable,
        textlines,
        startLine,
        diagnosticList,
        regexpHelper.getFullMustacheValue(attrName, memberVariable),
      ) && acc;
    }
  }, true);
}
