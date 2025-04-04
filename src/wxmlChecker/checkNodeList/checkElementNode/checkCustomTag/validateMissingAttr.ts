import type { Element } from "domhandler";
import { isCustomValue, isEventsValue, isUnionValue } from "../../../../componentManager/tsFileManager/helper";
import { type AttrValue, CUSTOM } from "../../../../componentManager/tsFileManager/types";
import { DiagnosticErrorType } from "../../../../diagnosticFixProvider/errorType";
import { generateTernaryExpression } from "../../../../utils/createTernaryExpression";
import type { CheckContext } from "../../../CheckContext";
import { generateDiagnostic } from "../../../tools/generateDiagnostic";
import { regexpHelper } from "../../../tools/regexpHelper";

// 获取正确的属性值 修复时使用
export function getCorrectValue(configAttrValue: AttrValue): string {
  if (isEventsValue(configAttrValue)) {
    return configAttrValue.value;
  } else if (isCustomValue(configAttrValue)) {
    return `{{${CUSTOM}}}`;
  } else if (isUnionValue(configAttrValue)) {
    const expectAttrValue = configAttrValue.values;

    return `{{ ${generateTernaryExpression(expectAttrValue)}}}`;
  } else {
    return `{{${configAttrValue.value}}}`;
  }
}
/**
 * 被允许忽略的属性
 * isReady 是annil给每个子组件提供的一个非必须属性，用于提供给block wxif的值
 * ``` wxml
 * <block wx:if="{{customA_isReady}}">
 *  <customA otherAttr="customA_otherAttr" />
 * </block>
 * ```
 */
const ignoreAttrs = ["isReady"];

/**
 * 验证缺失的属性
 * @param attrConfig 组件属性配置 key为属性名 value为属性值
 * @param currentAttrNames
 */
export function validateMissingAttr(
  element: Element,
  rawAttrNames: string[],
  expectedAttrNameList: string[],
  componentInfo: Record<string, AttrValue>,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList } = checkContext;
  const missingAttr = expectedAttrNameList.filter(
    (attrName) => !rawAttrNames.includes(attrName) && !ignoreAttrs.includes(attrName),
  );

  missingAttr.forEach((attrName) => {
    diagnosticList.push(generateDiagnostic(
      regexpHelper.getTagNameRegexp(element.name),
      DiagnosticErrorType.missingAttr,
      textlines,
      startLine,
      { fixCode: ` ${attrName}="${getCorrectValue(componentInfo[attrName])}"` },
    ));
  });
}
