import type { BaseContent, FileName, TagInfo } from "./types";
import { capitalize, indent } from "./utils";

export function handleCustomTag(
  fileName: FileName,
  tagInfo: TagInfo,
  context: BaseContent,
  customComponents: string[],
): void {
  const { element: { tagName } } = tagInfo;
  // 1.导入自定义组件的类路径
  if (
    !context.importPart.includes(
      `from miniTest.components.${tagName} import ${capitalize(tagName)}ComponentInfo, Partial${
        capitalize(tagName)
      }ComponentInfo`,
    )
  ) {
    context.importPart.push(
      `from miniTest.components.${tagName} import ${capitalize(tagName)}ComponentInfo, Partial${
        capitalize(tagName)
      }ComponentInfo`,
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
  // 3. 在组件信息中添加属性
  const customCompName = tagInfo.element.attribs.cid ?? tagName;
  context.customComponentInfo.splice(
    -2,
    0,
    `${indent}${indent}"${customCompName}": ${capitalize(tagName)}ComponentInfo,`,
  );
  context.partialCustomComponentInfo.splice(
    -3,
    0,
    `${indent}${indent}"${customCompName}": Partial${capitalize(tagName)}ComponentInfo,`,
  );
  // 4. 在测试类中添加获取组件信息的方法
  if (
    !context.testClass.includes(
      `${indent}def get${capitalize(tagName)}ComponentInfo(self,cid:str) -> ${capitalize(tagName)}ComponentInfo:`,
    )
  ) {
    context.testClass.push(
      `${indent}def get${capitalize(tagName)}ComponentInfo(self,cid:str) -> ${capitalize(tagName)}ComponentInfo:`,
      `${indent}${indent}${tagName}Element = self.element.get_element(f"*[id$='{cid}']")`,
      `${indent}${indent}from miniTest.components.${tagName} import ${capitalize(tagName)}Component`,
      `${indent}${indent}${capitalize(tagName)}Comp = ${capitalize(tagName)}Component(${tagName}Element)`,
      `${indent}${indent}return ${capitalize(tagName)}Comp.getComponentInfo()`,
    );
  }
  // 5.在getComponentInfo方法中添加调用获取组件信息的方法并将结果添加到组件信息字典中
  customComponents.splice(
    -1,
    0,
    `${indent}${indent}${indent}${indent}"${customCompName}": self.get${
      capitalize(tagName)
    }ComponentInfo(cid="${customCompName}"),`,
  );
}
