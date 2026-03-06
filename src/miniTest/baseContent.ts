import type { BaseContent, FileName } from "./types";
import { capitalize, indent } from "./utils";

export function getBaseContent(fileName: FileName): BaseContent {
  return {
    importPart: [
      "from typing import TYPE_CHECKING, TypedDict, List, Optional, Any",
      "from miniTest.common import Common",
      "",
      "if TYPE_CHECKING:",
      `${indent}from minium import BaseElement`,
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
