import * as vscode from "vscode";
import type { JsonUri } from "./uriHelper";
type SubComponentTag = string;
type SubComponentPath = string;
type UsingComponents = Record<SubComponentTag, SubComponentPath>;
type JsonConfig = {
  component?: true;
  usingComponents?: UsingComponents;
};

export type JsonFileInfo = { config: JsonConfig; text: string };
type JsonFileFsPath = string;
class JsonFile {
  private infoCache: Record<JsonFileFsPath, JsonFileInfo | undefined> = {};
  public async get(jsonUri: JsonUri): Promise<JsonFileInfo> {
    const fsPath = jsonUri.fsPath;
    const info = this.infoCache[fsPath];
    if (info === undefined) {
      await this.update(jsonUri);
    } else {
      return info;
    }

    return this.get(jsonUri);
  }
  public async update(jsonUri: JsonUri, jsonText?: string): Promise<void> {
    const fsPath = jsonUri.fsPath;
    if (jsonText === undefined) {
      jsonText = (await vscode.workspace.openTextDocument(fsPath)).getText();
    }
    this.infoCache[fsPath] = { config: JSON.parse(jsonText), text: jsonText };
  }
}

export const jsonFileManager = new JsonFile();
