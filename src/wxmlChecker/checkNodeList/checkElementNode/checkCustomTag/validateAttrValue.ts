import {
  isCustomValue,
  isEventsValue,
  isRootValue,
  isSelfValue,
  isUnionValue,
} from "../../../../componentManager/tsFileManager/helper";
import { type AttrValue, type Events, type Self, type Union } from "../../../../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { getMustacheExpressions, getMustacheValue } from "../../../../utils/getMustacheExpressions";
import type { CheckContext } from "../../../CheckContext";
import { handlers } from "../../../tools/handers";
import { regexpHelper } from "../../../tools/regexpHelper";
import { validateExpression } from "../../../validators/validateExpression";
import { validateHasMustacheValue } from "../../../validators/validateHasMustacheValue";
import { validateMustacheSyntax } from "../../../validators/validateMustachSyntax";
import { validateTernaryExpressionSyntax } from "../../../validators/validateTernaryExpressionSyntax";

import { validateVariableValidity } from "../../../validators/validateVariableValidity";
import { validateWithoutValue } from "../../../validators/validateWithoutValue";
import { getCorrectValue } from "./validateMissingAttr";
import { validateTernaryExpressionValue } from "./validateTernaryExpressionValue";

export function validateAttrValue(
  rawAttrName: string,
  rawAttrValue: string,
  expectValue: AttrValue,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList, wxForInfos, tsFileInfo } = checkContext;
  handlers([
    (): boolean =>
      // 1. 无值检测和空值检测
      validateWithoutValue(
        rawAttrName,
        startLine,
        textlines,
        diagnosticList,
        `${rawAttrName}="${getCorrectValue(expectValue)}"`,
      ),
    // 2. 事件值检测
    [(): boolean => isEventsValue(expectValue), (): boolean => {
      return validateVariableValidity(
        rawAttrValue,
        [(expectValue as Events).value],
        textlines,
        startLine,
        diagnosticList,
        DiagnosticErrorType.errorValue,
        regexpHelper.getFullValueRegexp(rawAttrName, rawAttrValue),
        (expectValue as Events).value,
      );
    }],
    // 3. inherit值或自身值检测
    [(): boolean => isRootValue(expectValue) || isSelfValue(expectValue), (): boolean =>
      validateMustacheSyntax(
        rawAttrName,
        rawAttrValue,
        textlines,
        startLine,
        diagnosticList,
        `{{ ${(expectValue as Self).value} }}`,
      ), (): boolean =>
      validateVariableValidity(
        getMustacheValue(rawAttrValue),
        [(expectValue as Self).value],
        textlines,
        startLine,
        diagnosticList,
        DiagnosticErrorType.errorValue,
        regexpHelper.getMustacheValue(getMustacheValue(rawAttrValue), rawAttrName),
        (expectValue as Self).value,
      )],
    // 4. 自定义值检测
    [(): boolean => isCustomValue(expectValue), (): boolean =>
      validateHasMustacheValue(
        rawAttrName,
        rawAttrValue,
        textlines,
        startLine,
        diagnosticList,
        false,
        `{{自定义}}`,
      ), (): boolean => {
      const mustacheValues = getMustacheExpressions(rawAttrValue);

      return mustacheValues.reduce((acc, mustacheValue) => {
        return validateExpression(
          mustacheValue,
          tsFileInfo.rootComponentInfo.dataList.concat(wxForInfos.itemNames).concat(wxForInfos.indexNames),
          startLine,
          textlines,
          diagnosticList,
          DiagnosticErrorType.nonSubComponentOrWxforVariable,
          wxForInfos.itemNames,
          true,
          rawAttrName,
        ) && acc;
      }, true);
    }],
    [
      (): boolean => isUnionValue(expectValue),
      (): boolean => {
        const ternaryValues = (expectValue as Union).values as [string, string];

        return validateHasMustacheValue(
          rawAttrName,
          rawAttrValue,
          textlines,
          startLine,
          diagnosticList,
          true,
          `{{ 表达式 ? ${ternaryValues[0]} : ${ternaryValues[1]} }}`,
        );
      },
      (): boolean => {
        const ternaryValues = (expectValue as Union).values as [string, string];

        return validateTernaryExpressionSyntax(
          rawAttrValue,
          textlines,
          startLine,
          diagnosticList,
          regexpHelper.getMustacheValue(rawAttrName, getMustacheValue(rawAttrValue)),
          ` 表达式 ? ${ternaryValues[0]} : ${ternaryValues[1]} `,
        );
      },
      (): boolean => {
        const ternaryValues = (expectValue as Union).values as [string, string];
        const mustacheValue = getMustacheValue(rawAttrValue);

        return validateTernaryExpressionValue(
          mustacheValue,
          ternaryValues[0],
          ternaryValues[1],
          tsFileInfo.rootComponentInfo.dataList.concat(wxForInfos.itemNames).concat(wxForInfos.indexNames),
          wxForInfos.itemNames,
          textlines,
          startLine,
          diagnosticList,
          rawAttrName,
        );
        // 三元表达式的值检测
      },
    ],
    [(): boolean => {
      throw Error(`不应该到这里报错 ${rawAttrName}, ${rawAttrValue}, `);
    }],
  ]);
}
