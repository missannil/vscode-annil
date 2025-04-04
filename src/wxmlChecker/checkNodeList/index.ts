import type { ChildNode } from "domhandler";
import { DiagnosticErrorType } from "../../diagnosticFixProvider/errorType";
import { assertNonNullable } from "../../utils/assertNonNullable";
import { getRandomStr } from "../../utils/getRandomStr";
import { checkChildNodes } from "../checkChildNodes";
import type { CheckContext } from "../CheckContext";
import { getLineNumber } from "../tools/getLineNumber";
import { checkAnnilCommentNode } from "./checkAnnilCommentNode";
import { checkElementNode } from "./checkElementNode";
import { checkDuplicateId } from "./checkElementNode/checkDuplicateId";
import { checkPendingConditionValue } from "./checkPendingConditionValue";
import { checkTextNode } from "./checkTextNode";
import { nodeType } from "./nodeType";

/**
 * 节点列表检测(递归子节点检测)
 * 提示:
 * 1. 同层的节点共用上层wxForInfos,进入新的wxForblock子节点时，应建立新的wxForInfos(包含上层和当前的信息),避免影响同层的其他节点使用wxForInfos
 * 2. pendingConditionBlockInfo的检测在多个位置。1.自定义组件检测开始前(有效值为wxForInfos和组件定义的变量) 2.无子节点会立即检测(针对空的条件block，有效值为wxForInfos和根组件中定义的变量) 3. 同级节点检测完后(针对条件block中无自定义组件但有其他子节点的情况，有效值为wxForInfos和根组件中定义的变量)
 * 3. 所有节点产生的diagnotic都会push到checkContext>diagnosticList中,为了书写简洁。
 * 4. 注释状态的更新时机: 1.元素节点检测完后 2.节点列表检测完后(自动结束某种注释状态,比如start)
 */
export function checkNodeList(
  childNodeList: ChildNode[],
  checkContext: CheckContext,
): void {
  // 1 当前节点层的标记,用于取消注释状态使用,这样可确保取消注释状态时只能取消同层的注释状态,取消不了上层的注释状态。
  const nodeLevelMark = getRandomStr(10);
  const { textlines, wxForInfos, tsFileInfo } = checkContext;
  for (const childNode of childNodeList) {
    const startLine = getLineNumber(textlines, assertNonNullable(childNode.startIndex));
    if (nodeType.isElement(childNode)) {
      // 出现元素标签后,后续所有标签都不是文件头部位置
      checkContext.isHeadLocation = false;
      checkDuplicateId(childNode, startLine, checkContext);
      if (!checkContext.isCommented()) {
        checkElementNode(childNode, startLine, checkContext);
      } else {
        checkChildNodes(childNode.childNodes, checkContext);
      }
      checkContext.updateCommentStatus("afterElementNode", nodeLevelMark);
      // 元素节点检测完后,取消repeatTag注释状态，
      checkContext.disableRepeatTag();
    } else if (nodeType.isTextNode(childNode)) {
      const text = childNode.data.trim();
      if (text === "" || checkContext.isCommented()) continue;
      checkTextNode(childNode, startLine, checkContext);
    } else if (nodeType.isCommentNode(childNode) && checkContext.isAnnilComment(childNode.data) === true) {
      const commentTypeOrNull = checkAnnilCommentNode(childNode, startLine, checkContext);
      if (commentTypeOrNull) {
        checkContext.setCommentStatus(commentTypeOrNull, nodeLevelMark);
      }
    }
  }
  // 同级节点检测完后,检查条件属性值(针对条件block中无自定义组件但有其他子节点(文本节点)的情况，有效值为wxForInfos和根组件中定义的变量)
  checkPendingConditionValue(
    tsFileInfo.rootComponentInfo.dataList.concat(wxForInfos.itemNames, wxForInfos.indexNames, [
      "true",
      "false",
    ]),
    DiagnosticErrorType.nonRootComponentDataOrWxforVariable,
    checkContext,
  );
  // 1 同级节点检测完后,取消注释状态
  checkContext.updateCommentStatus("afterNodeListChecked", nodeLevelMark);
}
