import { DiagnosticErrorType } from "../../../../../../diagnosticFixProvider/errorType";
import { getMustacheValue } from "../../../../../../utils/getMustacheExpressions";
import type { CheckContext } from "../../../../../CheckContext";
import { isMemberVariableExpression } from "../../../../../tools/isMemberVariableExpression";
import { isVariableExpression } from "../../../../../tools/isVariableExpression";
import { regexpHelper } from "../../../../../tools/regexpHelper";

import { generateInvalidExpression } from "../../../../../validators/generateInvalidExpression";
import { validateMustacheSyntax } from "../../../../../validators/validateMustachSyntax";
import { validateVariableValidity } from "../../../../../validators/validateVariableValidity";
import { validateMemberVariable } from "./validateMemberVariable";

// wxfor的合法值就应该是二种 1. rootComponentInfo中的数组类型数据(变量)或上层wx:for-item的变量 2. 上层wx:for-item产生的变量的成员变量 例如'xxx.ddd[0].yyy["xxx"]'的情况
export function validateWxforValue(
  rawAttrValue: string,
  startLine: number,
  checkContext: CheckContext,
): boolean {
  const { textlines, diagnosticList, tsFileInfo, wxForInfos } = checkContext;
  const attrName = "wx:for";
  // wx:for的值语法不是mustache
  if (!validateMustacheSyntax(attrName, rawAttrValue, textlines, startLine, diagnosticList, `{{数组类型变量名}}`)) {
    return false;
  }
  //  wx:for的值不合法(只允许使用rootComponentInfo中的数组数据(变量)或非单一变量,例如'xxx.ddd'的情况,不做处理)
  const mustacheValue = getMustacheValue(rawAttrValue);
  if (isVariableExpression(mustacheValue)) {
    return validateVariableValidity(
      mustacheValue,
      tsFileInfo.rootComponentInfo.arrTypeDatas.concat(wxForInfos.itemNames),
      textlines,
      startLine,
      diagnosticList,
      DiagnosticErrorType.nonRootComponentArrayTypeDataOrWxforItem,
      regexpHelper.getFullMustacheValue(attrName, mustacheValue),
    );
  }
  if (isMemberVariableExpression(mustacheValue)) {
    return validateMemberVariable(mustacheValue, startLine, checkContext, attrName);
  }
  generateInvalidExpression(startLine, textlines, mustacheValue, diagnosticList, attrName);

  return false;
}
