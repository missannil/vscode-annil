import * as vscode from "vscode";
import { type TsFileInfo } from "../componentManager/tsFileManager/types";
import { type WxmlFileInfo } from "../componentManager/wxmlFileManager";
import { CheckContext } from "./CheckContext";
import { checkMissingComponentTags } from "./checkMissingCustomTags";
import { checkNodeList } from "./checkNodeList";

export function wxmlChecker(
  wxmlFileInfo: WxmlFileInfo,
  tsFileInfo: TsFileInfo,
): vscode.Diagnostic[] {
  const checkContext = new CheckContext(
    wxmlFileInfo.text.split(/\n/),
    tsFileInfo,
  );
  checkNodeList(wxmlFileInfo.wxmlDocument.children, checkContext);
  checkMissingComponentTags(checkContext);

  return checkContext.diagnosticList;
}
