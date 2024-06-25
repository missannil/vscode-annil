// 将连字符(短横线)命名转换为驼峰命名
function hyphenToCamelCase<T extends string | string[]>(str: T): T {
  if (Array.isArray(str)) {
    return str.map((item) => hyphenToCamelCase(item)) as T;
  } else {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as T;
  }
}

/**
 *  找到数组中连字符字符串与驼峰命名等效的字符串组并返回在后面的字符串数组
 *  getDuplicate( ["a-a", "aA",'x']); => [ "aA"]
 *  getDuplicate( ["b-b-b", "bB-b","b-bB",'x']); => ["bB-b","b-bB"]
 *  getDuplicate( [ "aA","a-a","b-b-b", "bB-b","b-bB",'x']); => ["a-a","b-b-b", "bB-b","b-bB"]
 */
export function getDuplicate(arr: string[]): string[] {
  const existing: string[] = [];
  const result: string[] = [];
  for (const item of arr) {
    const camelCaseKey = hyphenToCamelCase(item);
    if (!existing.includes(camelCaseKey)) {
      existing.push(camelCaseKey);
    } else {
      result.push(item);
    }
  }

  return result;
}
