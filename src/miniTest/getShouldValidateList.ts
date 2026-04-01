import { vscode } from "../publicModule";
import type { ShouldValidateListParams, TagInfo } from "./types";
import {
  hasInnerText,
  isBlockTag,
  isConditional,
  isCustomTag,
  isElement,
  isLoop,
  isNativeTag,
  shouldValidateElement,
} from "./utils";

// eslint-disable-next-line complexity
export function buildShouldValidateList(params: ShouldValidateListParams): TagInfo[] {
  const { childNodes, scopeType, result, isRootBlock, isRootElement } = params;
  for (const childNode of childNodes) {
    // 1. 非元素节点不处理
    if (!isElement(childNode)) continue;
    // 2. 最外层(root)的第一个条件block标签要被忽略(约定这个block是控制wxml渲染的，不参与测试)
    if (isRootBlock && isBlockTag(childNode.name) && isConditional(childNode)) {
      buildShouldValidateList({
        childNodes: childNode.children,
        isRootBlock: false,
        isRootElement: params.isRootElement,
        scopeType: [...scopeType],
        result,
      });

      continue;
    }
    // 3. 如果当前组件不是原生组件或者没有id属性,那么认为没有根组件，报错
    if (isRootElement && (!isNativeTag(childNode.name) || !childNode.attribs.id)) {
      void vscode.window.showInformationMessage("缺少根组件,根组件必须原生组件且具有id属性", { modal: true });

      throw new Error("缺少根组件,根组件必须原生组件且具有id属性");
    }
    // 4. block标签本身不生成TagInfo,但它会改变scopeType,且子元素仍可能为需要验证的元素,所以继续往下遍历
    if (isBlockTag(childNode.name)) {
      const newScopeType = [...params.scopeType];
      if (isConditional(childNode)) {
        newScopeType.push("wxIf");
      } else if (isLoop(childNode)) {
        newScopeType.push("wxFor");
      }
      buildShouldValidateList({
        childNodes: childNode.children,
        isRootBlock: false,
        isRootElement: params.isRootElement,
        scopeType: newScopeType,
        result,
      });

      continue;
    }
    // 5. 其他元素节点根据条件决定是否生成TagInfo,第一次isRootElement为true,之后都为false
    if (isCustomTag(childNode.name)) {
      result.push(
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
      result.push(
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
    // 6. 继续遍历子节点
    buildShouldValidateList({
      childNodes: childNode.children,
      isRootBlock: false,
      isRootElement: params.isRootElement,
      scopeType: [...scopeType],
      result,
    });
  }

  return result;
}
