import * as fs from "fs";
import * as path from "path";
import type * as vscode from "vscode";
import { getSiblingUri } from "../componentManager/getSiblingUri";

export type TsUri = vscode.Uri & { type: "Ts" };

export type WxmlUri = vscode.Uri & { type: "Wxml" };

export type JsonUri = vscode.Uri & { type: "Json" };

export type ComponentUri = JsonUri | TsUri | WxmlUri;

export function isComponentUri(uri: vscode.Uri): uri is ComponentUri {
  const uriExtname = path.extname(uri.fsPath);
  if (uriExtname === ".ts" || uriExtname == ".wxml" || uriExtname == ".json") {
    const wxmlUri = getSiblingUri(uri, ".wxml");
    if (!fs.existsSync(wxmlUri.fsPath)) {
      return false;
    }

    const jsonUri = getSiblingUri(uri, ".json");
    if (!fs.existsSync(jsonUri.fsPath)) {
      return false;
    }

    const tsUri = getSiblingUri(uri, ".ts");
    if (!fs.existsSync(tsUri.fsPath)) {
      return false;
    }

    return true;
  }

  return false;
}
