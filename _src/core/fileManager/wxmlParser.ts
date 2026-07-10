import { type Domhandler, type Options, parseDocument, vscode } from "#deps";
import { FileCache } from "./fileCache.js";

/**
 * WXML 文件解析结果
 */
export type WxmlFileInfo = {
  /** 原始文本 */
  text: string;
  /** HTML 解析后的 DOM */
  wxmlDocument: Domhandler.Document;
  /** 文件中出现的自定义标签名列表 */
  componentTagNameList: string[];
};

const parserOptions: Options = {
  xmlMode: true,
  withStartIndices: true,
  withEndIndices: true,
};

/**
 * WXML 文件解析器
 */
class WxmlParser {
  #cache = new FileCache<WxmlFileInfo>();

  public async parse(uri: vscode.Uri): Promise<WxmlFileInfo> {
    const fsPath = uri.fsPath;
    const cached = this.#cache.get(fsPath);
    if (cached !== undefined) return cached;

    const text = (await vscode.workspace.openTextDocument(uri)).getText();
    const info = this.#parseText(text);
    this.#cache.set(fsPath, info);

    return info;
  }

  public updateFromText(uri: vscode.Uri, text: string): WxmlFileInfo {
    const info = this.#parseText(text);
    this.#cache.set(uri.fsPath, info);

    return info;
  }

  public getCached(fsPath: string): WxmlFileInfo | undefined {
    return this.#cache.get(fsPath);
  }

  public invalidate(fsPath: string): void {
    this.#cache.invalidate(fsPath);
  }

  #parseText(text: string): WxmlFileInfo {
    const wxmlDocument = parseDocument(text, parserOptions);
    const componentTagNameList = this.collectCustomTags(wxmlDocument.children);

    return { text, wxmlDocument, componentTagNameList };
  }
  private isElement(document: Domhandler.Node): document is Domhandler.Element {
    return document.type === "tag";
  }
  /** 递归收集 WXML 元素中的自定义标签名 */
  private collectCustomTags(childNodes: Domhandler.ChildNode[], result: string[] = []): string[] {
    for (const childNode of childNodes) {
      if (this.isElement(childNode)) {
        result.push(childNode.name);
        this.collectCustomTags(childNode.children, result);
      }
    }

    return result;
  }
}

export const wxmlParser = new WxmlParser();
