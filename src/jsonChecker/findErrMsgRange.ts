import { vscode } from "../publicModule";

export function findErrMsgRange(key: string, textlines: string[], startLine = 0): vscode.Range {
  const line = textlines.slice(startLine).findIndex((item) => item.includes(key)) + startLine;

  // 找不到key,则返回第一行
  if (line === -1) {
    return new vscode.Range(0, 5, 0, 0);
  }
  const start = textlines[line].indexOf(key);
  const end = start + key.length;

  return new vscode.Range(line, start, line, end);
}
