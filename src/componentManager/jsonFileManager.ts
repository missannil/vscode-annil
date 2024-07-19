import * as vscode from "vscode";
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
  public async get(fileFsPath: JsonFileFsPath): Promise<JsonFileInfo> {
    const info = this.infoCache[fileFsPath];
    if (info === undefined) {
      await this.update(fileFsPath);
    } else {
      return info;
    }

    return this.get(fileFsPath);
  }
  public async update(fileFsPath: JsonFileFsPath, jsonText?: string): Promise<void> {
    if (jsonText === undefined) {
      jsonText = (await vscode.workspace.openTextDocument(fileFsPath)).getText();
    }
    this.infoCache[fileFsPath] = { config: JSON.parse(jsonText), text: jsonText };
  }
}

export const jsonFileManager = new JsonFile();
