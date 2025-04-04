// 获取行号
export function getLineNumber(lines: string[], startIndex: number): number {
  let stringLength = 0;
  for (let i = 0; i <= lines.length; i++) {
    // 加1是因为split的时候会把\n去掉,实际长度比split的长度多1
    stringLength += lines[i].length + 1;
    if (stringLength > startIndex) {
      return i;
    }
  }

  return -1; // 如果没有找到，返回-1
}
