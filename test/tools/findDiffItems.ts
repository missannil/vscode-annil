// 去除2个数组中相同的元素(不考虑顺序)
export function findDiffItems(arrA: string[], arrB: string[]): string[] {
  const compA = arrA.slice(); 
  const compB = arrB.slice(); 
  const commonItems = compA.filter(str => {
    const index = compB.indexOf(str);
    if (index !== -1) {
      compB.splice(index, 1);

      return false;
    }

    return true;
  });

  return commonItems.concat(compB);
}
