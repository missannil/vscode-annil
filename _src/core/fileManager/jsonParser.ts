import { vscode } from "#deps";
import type { JsonFileInfo } from "../types/JsonFileInfo.js";
import { FileCache } from "./fileCache.js";

/**
 * JSON 文件解析器
 * 读取 JSON 文件 → 解析为 JsonFileInfo（config + text）
 */
class JsonParser {
  #cache = new FileCache<JsonFileInfo>();

  public async parse(uri: vscode.Uri): Promise<JsonFileInfo> {
    const fsPath = uri.fsPath;
    const cached = this.#cache.get(fsPath);
    if (cached !== undefined) return cached;

    const text = (await vscode.workspace.openTextDocument(uri)).getText();
    const info = this.#parseText(text);
    this.#cache.set(fsPath, info);

    return info;
  }

  public updateFromText(uri: vscode.Uri, text: string): JsonFileInfo {
    const info = this.#parseText(text);
    this.#cache.set(uri.fsPath, info);

    return info;
  }

  public getCached(fsPath: string): JsonFileInfo | undefined {
    return this.#cache.get(fsPath);
  }

  public invalidate(fsPath: string): void {
    this.#cache.invalidate(fsPath);
  }

  #parseText(text: string): JsonFileInfo {
    const config = JSON.parse(text) as JsonFileInfo["config"];

    return { config, text };
  }
}

export const jsonParser = new JsonParser();
