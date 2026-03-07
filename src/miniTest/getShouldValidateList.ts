import type { ShouldValidateListParams, TagInfo } from "./types";
import {
  hasInnerText,
  isBlockTag,
  isConditional,
  isCustomTag,
  isElement,
  isLoop,
  shouldValidateElement,
} from "./utils";

export function buildShouldValidateList(params: ShouldValidateListParams): TagInfo[] {
  const { childNodes, blockType, result, isRootBlock } = params;
  childNodes.forEach(childNode => {
    // 1. 非元素节点不处理
    if (!isElement(childNode)) return;

    // 2. 最外层(root)的第一个条件block标签要被忽略(约定这个block是控制wxml渲染的，不参与测试)
    if (isRootBlock && isBlockTag(childNode.name) && isConditional(childNode)) {
      buildShouldValidateList({
        childNodes: childNode.children,
        isRootBlock: false,
        isRootElement: params.isRootElement,
        blockType: [...blockType],
        result,
      });

      return;
    }
    // 3. block标签本身不生成TagInfo,但它会改变blockType,且子元素仍可能为需要验证的元素,所以继续往下遍历
    if (isBlockTag(childNode.name)) {
      const blockType = [...params.blockType];
      if (isConditional(childNode)) {
        blockType.push("wxIf");
      } else if (isLoop(childNode)) {
        blockType.push("wxFor");
      }
      buildShouldValidateList({
        childNodes: childNode.children,
        isRootBlock: false,
        isRootElement: params.isRootElement,
        blockType,
        result,
      });

      return;
    }
    // 4. 其他元素节点根据条件决定是否生成TagInfo,第一次isRootElement为true,之后都为false
    if (isCustomTag(childNode.name)) {
      result.push(
        {
          isRoot: params.isRootElement,
          blockType: [...blockType],
          element: childNode,
          // 自定义组件传入的solt内容应该是一个元素而不是文本，所以hasInnerText为false
          hasInnerText: false,
        },
      );

      return;
    }
    if (shouldValidateElement(childNode)) {
      result.push(
        {
          isRoot: params.isRootElement,
          blockType: [...blockType],
          element: childNode,
          hasInnerText: hasInnerText(childNode),
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
      blockType: [...blockType],
      result,
    });

    return;
  });

  return result;
}
