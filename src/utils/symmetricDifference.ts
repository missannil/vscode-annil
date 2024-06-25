export function symmetricDifference(setA: string[], setB: string[]): string[] {
  const differenceA = setA.filter(x => !setB.includes(x));
  const differenceB = setB.filter(x => !setA.includes(x));

  return differenceA.concat(differenceB);
}
