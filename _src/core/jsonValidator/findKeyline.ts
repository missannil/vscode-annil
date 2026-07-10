/**
 * 在源码行数组中查找指定 key 字符串所在的行号
 *
 * @param textlines - 源码行数组
 * @param key - 要查找的字符串
 * @returns 行号（0-based），未找到返回 -1
 */
export function findKeyline(textlines: string[], key: string): number {
  return textlines.findIndex((item) => item.includes(key));
}
