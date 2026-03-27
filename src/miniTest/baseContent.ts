import type { BaseContent, FileName } from "./types";
import { capitalize, indent } from "./utils";

export function getBaseContent(fileName: FileName): BaseContent {
  return {
    importPart: [
      "import json",
      "from typing import TypedDict, List, cast",
      "from miniTest.common import BaseElement, DiffConfig, assertions,extension",
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
    testClass: [`class ${capitalize(fileName)}Component:`],
  };
}
