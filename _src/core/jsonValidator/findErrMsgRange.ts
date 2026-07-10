import { vscode } from "#deps";

/**
 * 在源码行数组中定位指定 key 字符串，返回其 Range
 *
 * @param key - 要查找的字符串
 * @param textlines - 源码行数组
 * @param startLine - 从第几行开始查找（默认 0）
 */
export function findErrMsgRange(key: string, textlines: string[], startLine = 0): vscode.Range {
  const line = textlines.slice(startLine).findIndex((item) => item.includes(key)) + startLine;

  // 找不到 key，返回第一行
  if (line === -1) {
    return new vscode.Range(0, 5, 0, 0);
  }
  const start = textlines[line].indexOf(key);
  const end = start + key.length;

  return new vscode.Range(line, start, line, end);
}
