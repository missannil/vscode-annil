import type * as Domhandler from "domhandler";
import * as htmlparser2 from "htmlparser2";
import * as vscode from "vscode";
import type { WxmlUri } from "./uriHelper";
type WxmlFsPath = string;

export type WxmlFileInfo = { text: string; wxmlDocument: Domhandler.Document };
class WxmlFile {
  private infoCache: Record<WxmlFsPath, WxmlFileInfo | undefined> = {};
  public async get(wxmlUri: WxmlUri): Promise<WxmlFileInfo> {
    const fsPath = wxmlUri.fsPath;
    const wxmlFileInfo = this.infoCache[fsPath];
    if (wxmlFileInfo !== undefined) {
      return wxmlFileInfo;
    } else {
      await this.update(wxmlUri);
    }

    return this.get(wxmlUri);
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
  public async update(wxmlUri: WxmlUri, wxmlText?: string): Promise<void> {
    const fsPath = wxmlUri.fsPath;
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
      wxmlDocument: wxmlDocument,
    };
  }
}

export const wxmlFileManager = new WxmlFile();
