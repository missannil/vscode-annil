/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Identifier } from "@babel/types";
type ImportName = string;
type ImportPath = string;

export type ImportedVariables = Record<ImportName, ImportPath>;

export function getImportedVariables(nodePath: any): ImportedVariables {
  const importKind = nodePath.node.importKind;
  const importedValues: ImportedVariables = {};
  if (importKind === "value") {
    for (const specifier of nodePath.node.specifiers) {
      if (specifier.type === "ImportSpecifier" && specifier.importKind === "value") {
        const importedName = (specifier.local as Identifier).name;
        importedValues[importedName] = nodePath.node.source.value;
      }
    }
  }

  return importedValues;
}
