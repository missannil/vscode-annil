import type { Element } from "domhandler";
import type { CheckContext } from "../../../CheckContext";
import { nodeType } from "../../nodeType";
import { checkBlockTag } from "./checkBlockTag";
import { checkOtherTag } from "./checkOtherTag";

export function checkNativeTag(
  elementNode: Element,
  startLine: number,
  checkContext: CheckContext,
): void {
  if (nodeType.isBlockTag(elementNode)) {
    checkBlockTag(elementNode, startLine, checkContext);
  } else {
    checkOtherTag(elementNode, startLine, checkContext);
  }
}
