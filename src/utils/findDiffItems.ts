// 找出当前集合与原始集合相比多出的项
export function findDiffItems(originalList: string[], currentList: string[], match: "missing" | "extra"): string[] {
  const originalSet = new Set(originalList);
  const currentSet = new Set(currentList);

  if (match === "missing") {
    return originalList.filter((item) => !currentSet.has(item));
  }

  return currentList.filter((item) => !originalSet.has(item));
}
