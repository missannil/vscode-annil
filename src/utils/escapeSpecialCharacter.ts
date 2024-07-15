// 把特殊字符转义为普通字符
export function escapeSpecialCharacter(str: string): string {
  return str.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
}
