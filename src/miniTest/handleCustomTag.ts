import type { BaseContent, TagInfo } from "./types";
import { capitalize, indent } from "./utils";

export function handleCustomTag(
  tagInfo: TagInfo,
  context: BaseContent,
  customComponents: string[],
  realCustomCompName: string,
): void {
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
  // 2. 在CustomComponentInfo中添加属性
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
  // 4. 在测试类中添加获取组件信息的方法
  const hasGetComponentInfoMethod = context.testClass.includes(
    `${indent}def get${capitalize(realCustomCompName)}ComponentInfo(self,cid:str) -> ${
      capitalize(realCustomCompName)
    }ComponentInfo:`,
  );
  if (!hasGetComponentInfoMethod) {
    context.testClass.push(
      `${indent}def get${capitalize(realCustomCompName)}ComponentInfo(self,cid:str) -> ${
        capitalize(realCustomCompName)
      }ComponentInfo:`,
      `${indent}${indent}return ${capitalize(realCustomCompName)}Component(cid).getComponentInfo()`,
    );
  }
  // 5.在getComponentInfo方法中添加调用获取组件信息的方法并将结果添加到组件信息字典中
  customComponents.splice(
    -1,
    0,
    `${indent}${indent}${indent}${indent}"${customCompName}": self.get${
      capitalize(realCustomCompName)
    }ComponentInfo(cid="${customCompName}"),`,
  );
}
