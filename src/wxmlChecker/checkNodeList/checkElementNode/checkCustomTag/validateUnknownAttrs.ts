import { getVariablesFromComponentInfo } from "../../../../componentManager/tsFileManager/helper";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../../../utils/assertNonNullable";
import { getMustacheExpressions } from "../../../../utils/getMustacheExpressions";
import { hyphenToCamelCase } from "../../../../utils/hyphenToCamelCase";
import type { CheckContext } from "../../../CheckContext";
import { generateDiagnostic } from "../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../tools/regexpHelper";
import { validateExpression } from "../../../validators/validateExpression";

export function validateUnknownAttrs(
  rawAttrName: string,
  rawAttrValue: string,
  expectedAttrNames: string[],
  startLine: number,
  checkContext: CheckContext,
  tagInfo: { type: "custom" | "chunk"; name: string },
): boolean {
  const { textlines, diagnosticList, wxForInfos, tsFileInfo } = checkContext;
  // 等效的属性名称
  const equivalentArrName = hyphenToCamelCase(rawAttrName);
  // 允许的未知属性 验证mustache表达式
  if (checkContext.isAllowedUnknownAttribute(rawAttrName) && !expectedAttrNames.includes(rawAttrName)) {
    const expressions = getMustacheExpressions(rawAttrValue);
    const validVariables = (tagInfo.type === "custom"
      ? getVariablesFromComponentInfo(
        assertNonNullable(tsFileInfo.customComponentInfos[tagInfo.name]),
      )
      : assertNonNullable(tsFileInfo.chunkComopnentInfos[tagInfo.name]).dataList).concat(
        wxForInfos.itemNames,
        wxForInfos.indexNames,
        tsFileInfo.rootComponentInfo.dataList,
      );
    expressions.forEach((expression) => {
      validateExpression(
        expression,
        validVariables,
        startLine,
        textlines,
        diagnosticList,
        DiagnosticErrorType.nonSubComponentOrWxforVariable,
        wxForInfos.itemNames,
        true,
        rawAttrName,
      );
    });

    return false;
  }
  // 不允许的未知属性 报未知属性的错误
  if (!expectedAttrNames.includes(equivalentArrName)) {
    diagnosticList.push(generateDiagnostic(
      regexpHelper.getFullAttrRegexp(rawAttrName),
      DiagnosticErrorType.unknownAttr,
      textlines,
      startLine,
    ));

    return false;
  }

  return true;
}
