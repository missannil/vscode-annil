import * as vscode from "vscode";
import { uriHelper } from "../componentManager/uriHelper";

type CustomComponentTag = string;
type CustomComponentPath = string;
type UsingComponents = Record<CustomComponentTag, CustomComponentPath>;

export type JsonConfig = {
  component?: true;
  usingComponents?: UsingComponents;
};

export async function getJsonConfig(uri: vscode.Uri): Promise<JsonConfig | undefined> {
  const jsonUri = uriHelper.getSiblingUri(uri, ".json");
  try {
    return JSON.parse((await vscode.workspace.openTextDocument(jsonUri)).getText()) as JsonConfig;
  } catch (error) {
    return undefined;
  }
}
