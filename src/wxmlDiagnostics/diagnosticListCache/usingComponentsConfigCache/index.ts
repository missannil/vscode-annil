import * as vscode from "vscode";
type ElementTag = string;
type UsingComponentsConfig = ElementTag[];
type JsonFilePath = string;
type JsonConfig = {
  component?: true | undefined;
  usingComponents?: Record<string, string>;
};

export const usingComponentsConfigCache: Record<JsonFilePath, UsingComponentsConfig> = {};

export function hasUsingComponentsConfigCacheKey(jsonFilePath: JsonFilePath): boolean {
  return Boolean(usingComponentsConfigCache[jsonFilePath]);
}

export function setUsingComponentsConfigToCache(
  jsonFilePath: JsonFilePath,
  usingComponentsConfig: UsingComponentsConfig,
): void {
  usingComponentsConfigCache[jsonFilePath] = usingComponentsConfig;
}

export function getUsingComponentsConfigFromCache(
  jsonFilePath: JsonFilePath,
): UsingComponentsConfig | undefined {
  return usingComponentsConfigCache[jsonFilePath];
}

export function getUsingComponentConfigFromText(jsonText: string): string[] {
  const jsonConfig: JsonConfig = JSON.parse(jsonText);
  const usingComponents = jsonConfig.usingComponents;

  return usingComponents === undefined ? [] : Object.keys(usingComponents);
}

export async function getUsingComponentConfig(jsonUri: vscode.Uri): Promise<UsingComponentsConfig> {
  let usingComponentsConfig = getUsingComponentsConfigFromCache(jsonUri.fsPath);
  if (usingComponentsConfig === undefined) {
    const jsonDocument = await vscode.workspace.openTextDocument(jsonUri);
    usingComponentsConfig = getUsingComponentConfigFromText(jsonDocument.getText());
    setUsingComponentsConfigToCache(jsonUri.fsPath, usingComponentsConfig);
  }

  return usingComponentsConfig;
}
