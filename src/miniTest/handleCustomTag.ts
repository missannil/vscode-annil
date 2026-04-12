import type { BaseContent, MethodsRecord, TagInfo } from "./types";
import { capitalize, indent, isConditionalElement, isLoopElement } from "./utils";

// eslint-disable-next-line complexity
export function handleCustomTag(
  tagInfo: TagInfo,
  context: BaseContent,
  customComponents: string[],
  realCustomCompName: string,
  rootElementTagName: string,
  methodsRecord: MethodsRecord,
  // getElementMethodStrRecord: [string, number][],
): void {
  const { scopeType, isRoot } = tagInfo;
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

  if (isConditionalElement(scopeType)) {
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
  } else if (isLoopElement(scopeType)) {
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
  // 4. 在测试类中添加获取组件和组件信息的方法
  // 获取元素组件方法的第一行字符串。
  const getComponentMethodFirstStr = `${indent}def get${capitalize(realCustomCompName)}Component(self, cid: str) -> ${
    capitalize(realCustomCompName)
  }Component:`;
  const isExistMethodStr = context.testClass.some((line) => line.includes(getComponentMethodFirstStr));

  if (isConditionalElement(scopeType)) {
    // 没有获取元素组件方法时,才添加获取元素组件方法,避免重复添加
    if (!isExistMethodStr) {
      context.testClass.push(
        // 加入获取元素组件方法
        getComponentMethodFirstStr,
        `${indent}${indent}element = ${
          isRoot ? "self.rootElement" : `self.rootElement.get_element(f"${rootElementTagName}[id$='{cid}']")`
        }`,
        `${indent}${indent}return ${capitalize(realCustomCompName)}Component(element)`,
      );
    }
    // 加入获取元素组件信息方法
    context.testClass.push(
      `${indent}def get${capitalize(customCompName)}ComponentInfo(self, cid: str) -> ${
        capitalize(realCustomCompName)
      }ComponentInfo | None:`,
      `${indent}${indent}try:`,
      `${indent}${indent}${indent}elementComp = self.get${capitalize(realCustomCompName)}Component(cid)`,
      `${indent}${indent}${indent}return elementComp.getComponentInfo()`,
      `${indent}${indent}except Exception:`,
      `${indent}${indent}${indent}return None`,
    );
  } else if (isLoopElement(scopeType)) {
    //
    const getComponentListMethodFirstStr = `${indent}def get${
      capitalize(realCustomCompName)
    }ComponentList(self, cid: str) -> List[${capitalize(realCustomCompName)}Component]:`;
    const isExistListMethodStr = context.testClass.some((line) => line.includes(getComponentListMethodFirstStr));
    // 没有获取元素组件列表方法时,才添加获取元素组件列表方法,避免重复添加
    if (!isExistListMethodStr) {
      context.testClass.push(
        // 加入获取元素组件列表方法
        getComponentListMethodFirstStr,
        `${indent}${indent}try:`,
        `${indent}${indent}${indent}elements = self.rootElement.get_elements(f"${rootElementTagName}[id$='{cid}']")`,
        `${indent}${indent}${indent}return [${
          capitalize(realCustomCompName)
        }Component(element) for element in elements]`,
        `${indent}${indent}except Exception:`,
        `${indent}${indent}${indent}return []`,
      );
    }
    context.testClass.push(
      // 加入获取元素组件信息列表方法 可能获取到空列表
      `${indent}def get${capitalize(customCompName)}ComponentInfoList(self, cid: str) -> List[${
        capitalize(realCustomCompName)
      }ComponentInfo]: `,
      `${indent}${indent} return [element.getComponentInfo() for element in self.get${
        capitalize(realCustomCompName)
      }ComponentList(cid)]`,
    );
  } else {
    // 没有获取元素组件方法时,才添加获取元素组件方法,避免重复添加
    if (!isExistMethodStr) {
      context.testClass.push(
        // 加入获取元素组件方法
        getComponentMethodFirstStr,
        `${indent}${indent}element = ${
          isRoot ? "self.rootElement" : `self.rootElement.get_element(f"${rootElementTagName}[id$='{cid}']")`
        }`,
        `${indent}${indent}return ${capitalize(realCustomCompName)}Component(element)`,
      );
    }
    // 加入获取元素组件信息方法
    context.testClass.push(
      // 加入获取元素组件信息方法
      `${indent}def get${capitalize(customCompName)}ComponentInfo(self, cid: str) -> ${
        capitalize(realCustomCompName)
      }ComponentInfo: `,
      `${indent}${indent} return  self.get${capitalize(realCustomCompName)}Component(cid).getComponentInfo()`,
    );
  }

  // 5.在getComponentInfo方法中添加调用获取组件信息的方法并将结果添加到组件信息字典中
  const customCid = tagInfo.element.attribs["cid"] || realCustomCompName;
  if (isConditionalElement(scopeType)) {
    const methodStr = `get${capitalize(customCompName)}ComponentInfo`;
    // 添加记录获取组件信息方法的字符串，便于assertComponentInfo中调用
    methodsRecord[customCompName] = [methodStr, customCid];
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent} "${customCompName}": self.${methodStr} (cid = "${customCid}"), `,
    );
  } else if (isLoopElement(scopeType)) {
    const methodStr = `get${capitalize(customCompName)}ComponentInfoList`;
    // 添加记录获取组件信息方法的字符串，便于assertComponentInfo中调用
    methodsRecord[customCompName] = [methodStr, customCid];
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent} "${customCompName}": self.${methodStr} (cid = "${customCid}"), `,
    );
  } else {
    const methodStr = `get${capitalize(customCompName)}ComponentInfo`;
    // 添加记录获取组件信息方法的字符串，便于assertComponentInfo中调用
    methodsRecord[customCompName] = [methodStr, customCid];
    customComponents.splice(
      -1,
      0,
      `${indent}${indent}${indent}${indent} "${customCompName}": self.${methodStr} (cid = "${customCid}"), `,
    );
  }
}
