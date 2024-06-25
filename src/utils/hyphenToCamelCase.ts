 // 将连字符(短横线)命名转换为驼峰命名
 export function hyphenToCamelCase<T extends string | string[]>(str: T): T {
  if (Array.isArray(str)) {
    return str.map((item) => hyphenToCamelCase(item)) as T;
  } else {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as T;
  }
}