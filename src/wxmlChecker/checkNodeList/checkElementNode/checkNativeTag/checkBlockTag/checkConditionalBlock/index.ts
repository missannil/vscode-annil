import type { ChildNode } from "domhandler";
import { getMustacheValue } from "../../../../../../utils/getMustacheExpressions";
import { checkChildNodes } from "../../../../../checkChildNodes";
import type { CheckContext } from "../../../../../CheckContext";
import { validateMustacheSyntax } from "../../../../../validators/validateMustachSyntax";
import { validateWithoutValue } from "../../../../../validators/validateWithoutValue";
import { checkMutuallyExclusiveAttrs } from "./checkMutuallyExclusiveAttrs";
import { validateMissPrerequisite } from "./validateMissPrerequisite";
import { validateWxElseWithoutValue } from "./validateWxElseWithoutValue";

export function checkConditionalBlock(
  childNodes: ChildNode[],
  rawAttribs: Record<string, string>,
  startLine: number,
  checkContext: CheckContext,
): void {
  const { textlines, diagnosticList } = checkContext;
  const validConditionAttrName = checkMutuallyExclusiveAttrs(Object.keys(rawAttribs), startLine, checkContext);
  // 别名一下
  const attrName = validConditionAttrName;
  const rawAttrValue = rawAttribs[attrName].trim();
  // 2. 先决条件检测 不影响后续检测
  const res = validateMissPrerequisite(attrName, startLine, checkContext);
  checkContext.preConditionAttrName = attrName === "wx:else" ? null : attrName;
  if (!res) return;
  if (attrName === "wx:else") {
    // 2. wx:else属性不能有值
    validateWxElseWithoutValue(attrName, startLine, checkContext);
  } else {
    // 3. wx:if | wx:elif 值的语法检测
    if (
      validateWithoutValue(
        attrName,
        startLine,
        textlines,
        diagnosticList,
        `${attrName}="{{表达式}}"`,
      ) && validateMustacheSyntax(attrName, rawAttrValue, textlines, startLine, diagnosticList, `{{表达式}}`)
    ) {
      const mustacheValue = getMustacheValue(rawAttrValue);
      // 排除true | false值
      if (mustacheValue === "true" || mustacheValue === "false") return;
      // 4. 加入到待检测的条件块信息,然后续某个时间点检测
      checkContext.pendingConditionBlockInfo = {
        conditionAttrName: attrName,
        mustacheValue: mustacheValue.trim(),
        startLine,
      };
    }
  }
  checkChildNodes(childNodes, checkContext);
}
