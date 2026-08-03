import { type Domhandler } from "#deps";
import type { WxmlValidationContext } from "../../context.js";
import { findIllegalOperator } from "../../expression/validateIllegalOperator.js";
import { getConditionAttributes } from "./conditionAttributes.js";
import { ConditionDiagnosticCode, createConditionDiagnostic } from "./conditionDiagnostics.js";

/** 校验 block 条件链、条件属性互斥与 wx:else 值规则。 */
// eslint-disable-next-line complexity -- condition 规则需要按属性阶段顺序发布诊断
export function validateConditionStructure(
  node: Domhandler.Element,
  startLine: number,
  context: WxmlValidationContext,
  validNames: ReadonlySet<string>,
  booleanNames: ReadonlySet<string>,
  nodeStartOffset?: number,
): void {
  if (node.name !== "block") {
    context.setPreviousConditionAttribute(null);

    return;
  }

  const conditionAttributes = getConditionAttributes(context.textlines, startLine, nodeStartOffset);
  const conditionAttribute = conditionAttributes[0];
  if (conditionAttribute === undefined) {
    context.setPreviousConditionAttribute(null);

    return;
  }

  for (const attribute of conditionAttributes.slice(1)) {
    context.diagnosticList.push(
      createConditionDiagnostic(attribute, "已有条件属性", ConditionDiagnosticCode.mutuallyExclusive),
    );
  }

  const previousAttribute = context.getPreviousConditionAttribute();
  if (
    (conditionAttribute.name === "wx:elif" || conditionAttribute.name === "wx:else")
    && previousAttribute !== "wx:if"
    && previousAttribute !== "wx:elif"
  ) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        `${conditionAttribute.name} 缺少前置 wx:if 或 wx:elif`,
        ConditionDiagnosticCode.missingPrerequisite,
      ),
    );
  }
  if (conditionAttribute.name === "wx:else" && conditionAttribute.hasValue) {
    context.diagnosticList.push(
      createConditionDiagnostic(conditionAttribute, "不应有值", ConditionDiagnosticCode.elseHasValue),
    );
  }
  if (
    (conditionAttribute.name === "wx:if" || conditionAttribute.name === "wx:elif")
    && !conditionAttribute.hasValue
  ) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        `${conditionAttribute.name} 不可无值`,
        ConditionDiagnosticCode.missingValue,
      ),
    );
  }
  if (
    (conditionAttribute.name === "wx:if" || conditionAttribute.name === "wx:elif")
    && conditionAttribute.value !== undefined
    && !isMustacheValue(conditionAttribute.value)
  ) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        "不符合'{{}}'语法",
        ConditionDiagnosticCode.mustacheSyntax,
      ),
    );
  }
  if (
    (conditionAttribute.name === "wx:if" || conditionAttribute.name === "wx:elif")
    && conditionAttribute.value !== undefined
    && isMustacheValue(conditionAttribute.value)
    && !isValidConditionExpression(conditionAttribute.value)
  ) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        "条件表达式无效",
        ConditionDiagnosticCode.invalidExpression,
      ),
    );
  }
  const isConditionalAttribute = conditionAttribute.name === "wx:if" || conditionAttribute.name === "wx:elif";
  const conditionRoot = isConditionalAttribute
    ? getConditionRoot(conditionAttribute.value)
    : undefined;
  const simpleConditionRoot = isConditionalAttribute
    ? getSimpleConditionRoot(conditionAttribute.value)
    : undefined;
  if (conditionRoot !== undefined && !validNames.has(conditionRoot)) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        `未知数据: "${conditionRoot}"`,
        ConditionDiagnosticCode.unknownValue,
      ),
    );
  } else if (simpleConditionRoot !== undefined && !booleanNames.has(simpleConditionRoot)) {
    context.diagnosticList.push(
      createConditionDiagnostic(
        conditionAttribute,
        `条件数据必须是布尔类型: "${simpleConditionRoot}"`,
        ConditionDiagnosticCode.nonBooleanValue,
      ),
    );
  }
  context.setPreviousConditionAttribute(conditionAttribute.name);
}

function isMustacheValue(value: string): boolean {
  const trimmedValue = value.trim();

  return trimmedValue.startsWith("{{") && trimmedValue.endsWith("}}");
}

function getConditionRoot(value: string | undefined): string | undefined {
  if (value === undefined || !isMustacheValue(value)) return undefined;

  const expression = value.trim().slice(2, -2).trim();
  if (expression === "true" || expression === "false") return undefined;
  const rootMatch = /^([A-Za-z_$][\w$]*)(?:$|[.[])/.exec(expression);

  return rootMatch?.[1];
}

function getSimpleConditionRoot(value: string | undefined): string | undefined {
  const conditionRoot = getConditionRoot(value);
  if (conditionRoot === undefined) return undefined;

  const expression = value?.trim().slice(2, -2).trim();
  if (expression !== conditionRoot) return undefined;

  return conditionRoot;
}

function isValidConditionExpression(value: string): boolean {
  const expression = value.trim().slice(2, -2).trim();
  if (expression.length === 0) return false;

  return findIllegalOperator(expression) === null;
}
