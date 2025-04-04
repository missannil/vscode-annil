import type { Element } from "domhandler";
import { DiagnosticErrorType } from "../../../diagnosticFixProvider/errorType";
import type { CheckContext } from "../../CheckContext";
import { generateDiagnostic } from "../../tools/generateDiagnostic";
import { regexpHelper } from "../../tools/regexpHelper";
import { nodeType } from "../nodeType";
import { checkChunkTag } from "./checkChunkTag";
import { checkCustomTag } from "./checkCustomTag";
import { checkNativeTag } from "./checkNativeTag";

function generateUnknownTagDiagnostic(
  elementNode: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  const elementName = elementNode.name;
  checkContext.diagnosticList.push(
    generateDiagnostic(
      regexpHelper.getTagNameRegexp(elementName),
      DiagnosticErrorType.unknownTag,
      checkContext.textlines,
      startLine,
    ),
  );
}

export function checkElementNode(
  elementNode: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  if (checkContext.isCustomTag(elementNode)) {
    checkCustomTag(elementNode, startLine, checkContext);
  } else if (checkContext.isChunkTag(elementNode)) {
    checkChunkTag(elementNode, startLine, checkContext);
  } else if (nodeType.isNativeTag(elementNode)) {
    checkNativeTag(elementNode, startLine, checkContext);
  } else if (!checkContext.ignoreTags.includes(elementNode.name)) {
    // 生成未知标签错误
    generateUnknownTagDiagnostic(elementNode, startLine, checkContext);
  }
}
