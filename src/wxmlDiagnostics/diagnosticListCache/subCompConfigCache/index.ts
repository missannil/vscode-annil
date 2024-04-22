import * as vscode from "vscode";
import { getSubCompConfigFromText } from "./getSubCompConfigFromText";
type AttributeName = string;

// inhrit属性值可能字符串数组
export type AttributeValue = string | string[];

export type AttributeConfig = Record<AttributeName, AttributeValue>;
type SubCompName = string;

export type SubCompConfig = Record<SubCompName, AttributeConfig>;

export type TsFilePath = string;

// ts文件中所有子组件属性的缓存
export const subCompConfigCache: Record<TsFilePath, SubCompConfig | undefined> =
  {};

export function hasSubCompConfigCacheKey(tsFilePath: TsFilePath): boolean {
  return Boolean(subCompConfigCache[tsFilePath]);
}

export function setSubCompConfigToCache(
  tsFilePath: TsFilePath,
  allSubCompAttrs: SubCompConfig
): void {
  subCompConfigCache[tsFilePath] = allSubCompAttrs;
}

export async function getSubCompConfig(
  tsUri: vscode.Uri
): Promise<SubCompConfig> {
  let allSubCompAttrs = subCompConfigCache[tsUri.fsPath];
  if (allSubCompAttrs === undefined) {
    const tsDocument = await vscode.workspace.openTextDocument(tsUri);
    allSubCompAttrs = getSubCompConfigFromText(tsDocument.getText());
    setSubCompConfigToCache(tsUri.fsPath, allSubCompAttrs);
  }

  return allSubCompAttrs;
}
