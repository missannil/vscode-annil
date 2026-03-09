import type { BaseContent, FileName } from "./types";
import { capitalize, indent } from "./utils";

export function getBaseContent(fileName: FileName): BaseContent {
  return {
    importPart: [
      "from typing import TypedDict, List",
      "from miniTest.common import Common, BaseElement, FieldCompareConfig",
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
    testClass: [`class ${capitalize(fileName)}Component(Common):`],
  };
}
