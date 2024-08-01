import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// 小程序组件必要的三个文件扩展名
type ComponentFileExtensions = ".wxml" | ".json" | ".ts";

export type TsUri = vscode.Uri & { type: "Ts" };

export type WxmlUri = vscode.Uri & { type: "Wxml" };

export type JsonUri = vscode.Uri & { type: "Json" };

export type ComponentUri = JsonUri | TsUri | WxmlUri;

export type JsonFsPath = `Json fs path `;

export type WxmlFsPath = `Wxml fs path `;

export type ComponentDirPath = `Component dir path `;
class UriHelper {
  public isTsFile(componentUri: ComponentUri): componentUri is TsUri {
    return componentUri.fsPath.endsWith(".ts");
  }
  public isJsonFile(componentUri: ComponentUri): componentUri is JsonUri {
    return componentUri.fsPath.endsWith(".json");
  }
  public isWxmlFile(componentUri: ComponentUri): componentUri is WxmlUri {
    return componentUri.fsPath.endsWith(".wxml");
  }
  public getJsonFsPath(jsonUri: JsonUri): JsonFsPath {
    return jsonUri.fsPath as JsonFsPath;
  }
  public getWxmlFsPath(wxmlUri: WxmlUri): WxmlFsPath {
    return wxmlUri.fsPath as WxmlFsPath;
  }
  public isComponentUri(uri: vscode.Uri): uri is ComponentUri {
    const uriExtname = path.extname(uri.fsPath);
    if (uriExtname === ".ts" || uriExtname == ".wxml" || uriExtname == ".json") {
      const wxmlUri = this.getSiblingUri(uri, ".wxml");
      if (!fs.existsSync(wxmlUri.fsPath)) {
        return false;
      }

      const jsonUri = this.getSiblingUri(uri, ".json");
      if (!fs.existsSync(jsonUri.fsPath)) {
        return false;
      }

      const tsUri = this.getSiblingUri(uri, ".ts");
      if (!fs.existsSync(tsUri.fsPath)) {
        return false;
      }

      return true;
    }

    return false;
  }
  /**
   * 获取源Uri的兄弟文件的Uri
   * @param sourceUri 源Uri
   * @param siblingExtension 兄弟文件的扩展名
   * @returns 兄弟文件的Uri
   */
  public getSiblingUri(componentUri: vscode.Uri, siblingExtension: ".json"): JsonUri;

  public getSiblingUri(componentUri: vscode.Uri, siblingExtension: ".wxml"): WxmlUri;

  public getSiblingUri(componentUri: vscode.Uri, siblingExtension: ".ts"): TsUri;

  public getSiblingUri(componentUri: vscode.Uri, siblingExtension: ComponentFileExtensions): ComponentUri {
    const uriExtname = path.extname(componentUri.fsPath);
    const dir = path.dirname(componentUri.fsPath);
    const sourceFilename = path.basename(componentUri.fsPath, uriExtname);
    const siblingPath = path.join(dir, sourceFilename + siblingExtension);
    const siblingUri = vscode.Uri.file(siblingPath);
    if (siblingExtension === ".ts") {
      return siblingUri as TsUri;
    } else if (siblingExtension === ".wxml") {
      return siblingUri as WxmlUri;
    } else {
      return siblingUri as JsonUri;
    }
  }
  public getComponentDirPath(uri: ComponentUri): ComponentDirPath {
    const uriExtname = path.extname(uri.fsPath);

    return uri.fsPath.replace(uriExtname, "") as ComponentDirPath;
  }
}

export const uriHelper = new UriHelper();