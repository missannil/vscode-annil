import { hyphenToCamelCase } from "./hyphenToCamelCase";

/**
 *  找到数组中连字符字符串与驼峰命名等效的字符串组并返回
 *  getDuplicateAttrNames( ["a-a", "aA",'other']); =>  => ["a-a"]
 *  getDuplicateAttrNames( ["b-b-b", "bB-b","b-bB",'other']); => ["b-b-b", "bB-b"]
 *  getDuplicateAttrNames( ["a-a", "aA","b-b-b", "bB-b","b-bB",'other']); => ["a-a","b-b-b", "bB-b"]
 */
export function getDuplicateAttrNames(keys: string[]): string[] {
  const map = new Map();
  for (const key of keys) {
    const camelCaseKey = hyphenToCamelCase(key);
    if (!map.has(camelCaseKey)) {
      map.set(camelCaseKey, [key]);
    } else {
      map.get(camelCaseKey).push(key);
    }
  }
  const duplicateAttrNames: string[][] = Array.from(map.values());

  return duplicateAttrNames.filter((group) => group.length > 1).flatMap(
    (duplicateNames) => duplicateNames.slice(0, -1),
  );
}
