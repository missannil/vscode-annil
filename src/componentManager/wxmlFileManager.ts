import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";
import * as vscode from "vscode";
import { ignoreTags } from "../utils/ignoreTags";
type WxmlFsPath = string;
type WxmlFileInfo = { text: string; customTagList: string[]; wxmlDocument: Domhandler.Document };
class WxmlFile {
  private infoCache: Record<WxmlFsPath, WxmlFileInfo | undefined> = {};
  public async get(fsPath: WxmlFsPath): Promise<WxmlFileInfo> {
    const wxmlInfo = this.infoCache[fsPath];
    if (!wxmlInfo) {
      await this.update(fsPath);
    } else {
      return wxmlInfo;
    }

    return this.get(fsPath);
  }
  // 收集wxml文件中的自定义标签
  private collectCustomTags(childNodeList: Domhandler.ChildNode[], customTagsList: string[] = []): string[] {
    Array.from(childNodeList).forEach(childNode => {
      if (this.isElement(childNode)) {
        customTagsList.push(childNode.name);
        this.collectCustomTags(childNode.children, customTagsList);
      }
    });

    return customTagsList;
  }
  private isElement(document: Domhandler.Node): document is Domhandler.Element {
    return document.type === "tag";
  }
  private removeNativeComponent(customTagsList: string[]): string[] {
    return customTagsList.filter(tagName => !ignoreTags.includes(tagName));
  }
  private uniqueArray<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }
  private getCustomTagList(wxmlDocument: Domhandler.Document): string[] {
    const customTagList = this.collectCustomTags(wxmlDocument.children);

    return this.uniqueArray(this.removeNativeComponent(customTagList));
  }
  public async update(fsPath: string, wxmlText?: string): Promise<void> {
    if (wxmlText === undefined) {
      // console.log('更新wxml文件信息');
      wxmlText = (await vscode.workspace.openTextDocument(fsPath)).getText();
    }
    // htmlparser2是符合wxml语法的解析器,支持自闭合标签/标签大小写敏感/...
    const wxmlDocument = htmlparser2.parseDocument(wxmlText, {
      xmlMode: true,
      withStartIndices: true,
      withEndIndices: true,
    });

    this.infoCache[fsPath] = {
      text: wxmlText,
      customTagList: this.getCustomTagList(wxmlDocument),
      wxmlDocument: wxmlDocument,
    };
  }
}

export const wxmlFileManager = new WxmlFile();
