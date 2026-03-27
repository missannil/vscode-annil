import type { BaseContent, TagInfo } from "./types";
import { capitalize, indent, isConditionalElement, isLoopElement } from "./utils";

// eslint-disable-next-line complexity
export function handleCustomTag(
  tagInfo: TagInfo,
  context: BaseContent,
  customComponents: string[],
  realCustomCompName: string,
  rootElementTagName: string,
): void {
  const { blockType } = tagInfo;
  const hasImport = context.importPart.includes(
    `from miniTest.components.${realCustomCompName} import ${capitalize(realCustomCompName)}Component, ${
      capitalize(realCustomCompName)
    }ComponentInfo, Partial${capitalize(realCustomCompName)}ComponentInfo`,
  );
  if (!hasImport) {
    // 1. 加入自定义组件的组件信息类和部分组件信息类的导入语句
    context.importPart.push(
      `from miniTest.components.${realCustomCompName} import ${capitalize(realCustomCompName)}Component, ${
        capitalize(realCustomCompName)
      }ComponentInfo, Partial${capitalize(realCustomCompName)}ComponentInfo`,
    );
  }
  // 2. 首个自定义组件时,添加CustomComponentInfo和PartialCustomComponentInfo的定义，并将customComponents添加到组件信息和部分组件信息中
  if (context.customComponentInfo.length === 0) {
    context.customComponentInfo.push(
      `CustomComponentInfo = TypedDict(`,
      `${indent}"CustomComponentInfo",`,
      `${indent}{`,
      `${indent}},`,
      ")",
    );

    context.componentInfo.splice(-2, 0, `${indent}${indent}"customComponents": CustomComponentInfo,`);
    context.partialCustomComponentInfo.push(
      `PartialCustomComponentInfo = TypedDict(`,
      `${indent}"PartialCustomComponentInfo",`,
      `${indent}{`,
      `${indent}},`,
      `${indent}total=False,`,
      ")",
    );
    context.partialComponentInfo.splice(-3, 0, `${indent}${indent}"customComponents": PartialCustomComponentInfo,`);
  }
  // 3. 在组件信息中添加该标签的组件信息属性
  const customCompName = tagInfo.element.tagName;
  if (isConditionalElement(blockType)) {
    context.customComponentInfo.splice(
      -2,
      0,
      `${indent}${indent}"${customCompName}": ${capitalize(realCustomCompName)}ComponentInfo | None,`,
    );
    context.partialCustomComponentInfo.splice(
      -3,
      0,
      `${indent}${indent}"${customCompName}": Partial${capitalize(realCustomCompName)}ComponentInfo | None,`,
    );
  } else if (isLoopElement(blockType)) {
    context.customComponentInfo.splice(
      -2,
      0,
      `${indent}${indent}"${customCompName}": List[${capitalize(realCustomCompName)}ComponentInfo],`,
    );
    context.partialCustomComponentInfo.splice(
      -3,
      0,
      `${indent}${indent}"${customCompName}": List[Partial${capitalize(realCustomCompName)}ComponentInfo],`,
    );
  } else {
    // 普通元素
    context.customComponentInfo.splice(
      -2,
      0,
      `${indent}${indent}"${customCompName}": ${capitalize(realCustomCompName)}ComponentInfo,`,
    );
    context.partialCustomComponentInfo.splice(
      -3,
      0,
      `${indent}${indent}"${customCompName}": Partial${capitalize(realCustomCompName)}ComponentInfo,`,
    );
  }
  // 4. 在测试类中添加获取组件信息的方法
  if (isConditionalElement(blockType)) {
    const methodStr = `${indent}def get${capitalize(realCustomCompName)}Component(self, cid: str) -> ${
      capitalize(realCustomCompName)
    }Component | None:`;
    const hasGetComponentMethod = context.testClass.some((line) => line.includes(methodStr));
    if (!hasGetComponentMethod) {
      context.testClass.push(
        // 条件元素 加入获取元素方法 有可能获取到None
        methodStr,
        `${indent}${indent}try:`,
        `${indent}${indent}${indent}element = self.rootElement.get_element(f"${rootElementTagName}[id$='{cid}']")`,
        `${indent}${indent}${indent}return ${capitalize(realCustomCompName)}Component(element)`,
        `${indent}${indent}except Exception:`,
        `${indent}${indent}${indent}return None`,
      );
    }
    context.testClass.push(
      // 加入获取元素信息方法 有可能获取到None
      `${indent}def get${capitalize(customCompName)}ComponentInfo(self, cid: str) -> ${
        capitalize(realCustomCompName)
      }ComponentInfo | None:`,
      `${indent}${indent}element = self.get${capitalize(realCustomCompName)}Component(cid)`,
      `${indent}${indent}return element.getComponentInfo() if element else None`,
    );
  } else if (isLoopElement(blockType)) {
    const methodStr = `${indent}def get${capitalize(realCustomCompName)}ComponentList(self, cid: str) -> List[${
      capitalize(realCustomCompName)
    }Component]:`;
    const hasMethod = context.testClass.some((line) => line.includes(methodStr));
    if (!hasMethod) {
      context.testClass.push(
        // 循环元素 加入获取元素列表方法 可能获取到空列表
        methodStr,
        `${indent}${indent}return [`,
        `${indent}${indent}${indent}${capitalize(realCustomCompName)}Component(element)`,
        `${indent}${indent}${indent}for element in self.rootElement.get_elements(f"${rootElementTagName}[id$='{cid}']")`,
        `${indent}${indent}]`,
      );
    }
    context.testClass.push(
      // 加入获取元素信息列表方法 可能获取到空列表
      `${indent}def get${capitalize(customCompName)}ComponentInfoList(self, cid: str) -> List[${
        capitalize(realCustomCompName)
      }ComponentInfo]:`,
      `${indent}${indent}return [element.getComponentInfo() for element in self.get${
        capitalize(realCustomCompName)
      }ComponentList(cid)]`,
    );
  } else {
    // 普通元素
    const methodStr = `${indent}def get${capitalize(realCustomCompName)}Component(self, cid: str) -> ${
      capitalize(realCustomCompName)
    }Component | None:`;
    const hasGetComponentMethod = context.testClass.some(
      // 为了避免还有相同的自定义组件(有可能是条件元素),所以这里直接定义一个获取返回None的方法,这样避免重复定义。但不是条件的组件要强制返回非None类型。
      (line) => line.includes(methodStr),
    );
    if (!hasGetComponentMethod) {
      context.testClass.push(
        // 加入获取元素方法
        methodStr,
        `${indent}${indent}try:`,
        `${indent}${indent}${indent}element = self.rootElement.get_element(f"${rootElementTagName}[id$='{cid}']")`,
        `${indent}${indent}${indent}return ${capitalize(realCustomCompName)}Component(element)`,
        `${indent}${indent}except Exception:`,
        `${indent}${indent}${indent}return None`,
      );
    }
    context.testClass.push(
      // 加入获取元素信息方法
      `${indent}def get${capitalize(customCompName)}ComponentInfo(self, cid: str) -> ${
        capitalize(realCustomCompName)
      }ComponentInfo:`,
      // 强制返回非None类型 因为不是条件元素
      `${indent}${indent}return cast(${capitalize(realCustomCompName)}Component, self.get${
        capitalize(realCustomCompName)
      }Component(cid)).getComponentInfo()`,
    );
  }
  // 5.在getComponentInfo方法中添加调用获取组件信息的方法并将结果添加到组件信息字典中
  if (isConditionalElement(blockType)) {
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent}"${customCompName}": self.get${
        capitalize(customCompName)
      }ComponentInfo(cid="${customCompName}"),`,
    );
  } else if (isLoopElement(blockType)) {
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent}"${customCompName}": self.get${
        capitalize(customCompName)
      }ComponentInfoList(cid="${customCompName}"),`,
    );
  } else {
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent}"${customCompName}": self.get${
        capitalize(customCompName)
      }ComponentInfo(cid="${customCompName}"),`,
    );
  }
}
