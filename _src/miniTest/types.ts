import type * as Domhandler from "domhandler";

export type ScopeType = "wxIf" | "wxFor";

export type TagInfo = {
  element: Domhandler.Element;
  isRoot: boolean;
  scope: readonly ScopeType[];
  isCustom: boolean;
  hasInnerText: boolean;
};

export type MiniTestOptions = {
  outputPath: string;
  generatedAttributes: readonly string[];
};
