import * as vscode from "vscode";
type SubComponentTag = string;
type ImportedCustomComponentNames = SubComponentTag[];
type JsonFilePath = string;
type JsonConfig = {
  component?: true | undefined;
  usingComponents?: Record<string, string>;
};

export const importedCustomComponentNamesCache: Record<
  JsonFilePath,
  ImportedCustomComponentNames
> = {};

export function hasImportedCustomComponentNamesCache(
  jsonFilePath: JsonFilePath
): boolean {
  return Boolean(importedCustomComponentNamesCache[jsonFilePath]);
}

export function setImportedCustomComponentNamesToCache(
  jsonFilePath: JsonFilePath,
  importedCustomComponentNames: ImportedCustomComponentNames
): void {
  importedCustomComponentNamesCache[jsonFilePath] =
    importedCustomComponentNames;
}

export function getImportedCustomComponentNamesFromCache(
  jsonFilePath: JsonFilePath
): ImportedCustomComponentNames | undefined {
  return importedCustomComponentNamesCache[jsonFilePath];
}

export function getImportedCustomComponentNamesFromText(
  jsonText: string
): string[] {
  const jsonConfig: JsonConfig = JSON.parse(jsonText);
  const importedCustomComponentNames = jsonConfig.usingComponents;

  return importedCustomComponentNames === undefined ? [] : Object.keys(importedCustomComponentNames);
}

export async function getImportedCustomComponentNames(
  jsonUri: vscode.Uri
): Promise<ImportedCustomComponentNames> {
  let importedCustomComponentNames = getImportedCustomComponentNamesFromCache(jsonUri.fsPath);
  if (importedCustomComponentNames === undefined) {
    const jsonDocument = await vscode.workspace.openTextDocument(jsonUri);
    importedCustomComponentNames = getImportedCustomComponentNamesFromText(
      jsonDocument.getText()
    );
    setImportedCustomComponentNamesToCache(
      jsonUri.fsPath,
      importedCustomComponentNames
    );
  }

  return importedCustomComponentNames;
}
