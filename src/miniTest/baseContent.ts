import type { BaseContent, FileName } from "./types";
import { capitalize, indent } from "./utils";

export function getBaseContent(fileName: FileName): BaseContent {
  return {
    importPart: [
      "from miniTest.common import Common, BaseElement, TypedDict,cast, List, DiffConfig",
      "",
    ],
    customComponentInfo: [],
    partialCustomComponentInfo: [],
    componentInfo: [
      `${capitalize(fileName)}ComponentInfo = TypedDict(`,
      `${indent}"${capitalize(fileName)}ComponentInfo",`,
      `${indent}{`,
      `${indent}}`,
      ")",
    ],
    partialComponentInfo: [
      `Partial${capitalize(fileName)}ComponentInfo = TypedDict(`,
      `${indent}"Partial${capitalize(fileName)}ComponentInfo",`,
      `${indent}{`,
      `${indent}},`,
      `${indent}total=False,`,
      ")",
    ],
    testClass: [
      `class ${capitalize(fileName)}Component(Common):`,
      `${indent}def __init__(self, rootElement: BaseElement) -> None:`,
      `${indent}${indent}super().__init__()`,
      `${indent}${indent}self.rootElement = rootElement`,
    ],
  };
}
