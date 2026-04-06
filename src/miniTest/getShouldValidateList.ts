import { type Domhandler } from "../publicModule";
import type { ShouldValidateListParams, TagInfo } from "./types";
import {
  hasInnerText,
  isBlockTag,
  isConditionalBlock,
  isCustomTag,
  isElement,
  isLoop,
  shouldValidateElement,
} from "./utils";

// 最外层的第一个条件block标签要被忽略(这个block是控制wxml渲染的,应该被忽略)
function shouldIgnoreBlock(isRootBlock: boolean, node: Domhandler.Element): boolean {
  return isRootBlock && isBlockTag(node.name) && isConditionalBlock(node);
}

/**
 * 建立应该被验证的元素列表, 这个列表中的元素需要满足以下条件:
 * 1. 是元素节点
 * 2. 不是被忽略的block标签
 * 3. 不是block标签(因为block标签不生成TagInfo,但它会改变scopeType,且子元素仍可能为需要验证的元素)
 * 4. 是自定义组件标签，或者是满足shouldValidateElement条件的原生标签
 * 5. 最外层的第一个元素节点(isRootElement)会被当做根节点区别于后面的节点,所以isRootElement只会有一个true,之后的都是false
 *
 * 注意:
 *   1. wxml最外层只能有一个条件block标签包裹,不允许有同级的其他组件了,不报错但会忽略。
 *   2. 另外生成的标签信息项可能都不是根元素(即允许wxml没有根元素)。
 */
export function buildShouldValidateList(params: ShouldValidateListParams): TagInfo[] {
  const { childNodes, scopeType, tagInfoList, isRootBlock } = params;
  for (const childNode of childNodes) {
    // 1. 非元素节点不处理
    if (!isElement(childNode)) continue;
    // 2. 是否是需要忽略的block标签
    if (shouldIgnoreBlock(isRootBlock, childNode)) {
      // 直接return了,因为wxml最外层只能有一个条件block标签包裹,不允许有同级的其他组件了。
      return buildShouldValidateList({
        childNodes: childNode.children,
        // 把isRootBlock设置为false,因为只有最外层的第一个条件block标签会被认为是isRootBlock,且这个标签不会生成TagInfo;之后的条件block标签都不是isRootBlock了。
        isRootBlock: false,
        isRootElement: params.isRootElement,
        scopeType: [...scopeType],
        tagInfoList: tagInfoList,
      });
    }
    // 3. block标签本身不生成TagInfo,但它会改变scopeType,且子元素仍可能为需要验证的元素,所以继续往下遍历
    if (isBlockTag(childNode.name)) {
      const newScopeType = [...params.scopeType];
      if (isConditionalBlock(childNode)) {
        newScopeType.push("wxIf");
      } else if (isLoop(childNode)) {
        newScopeType.push("wxFor");
      }
      buildShouldValidateList({
        childNodes: childNode.children,
        isRootBlock: false,
        isRootElement: params.isRootElement,
        scopeType: newScopeType,
        tagInfoList: tagInfoList,
      });

      continue;
    }
    // 4. 其他元素节点根据条件决定是否生成TagInfo,第一次isRootElement为true,之后都为false
    if (isCustomTag(childNode.name)) {
      tagInfoList.push(
        {
          isRoot: params.isRootElement,
          scopeType: [...scopeType],
          element: childNode,
          // 自定义组件传入的solt内容应该是一个元素而不是文本，所以hasInnerText为false
          hasInnerText: false,
          isCustomTag: true,
        },
      );
    } else if (shouldValidateElement(childNode)) {
      tagInfoList.push(
        {
          isRoot: params.isRootElement,
          scopeType: [...scopeType],
          element: childNode,
          hasInnerText: hasInnerText(childNode),
          isCustomTag: false,
        },
      );
    }
    // 经过一次非block元素节点后，isRootElement就被认为是false了，后续的元素节点都不是根节点了
    params.isRootElement = false;
    // 5. 继续遍历子节点
    buildShouldValidateList({
      childNodes: childNode.children,
      isRootBlock: false,
      isRootElement: params.isRootElement,
      scopeType: [...scopeType],
      tagInfoList: tagInfoList,
    });
  }

  return tagInfoList;
}
