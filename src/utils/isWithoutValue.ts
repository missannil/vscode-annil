export function isWithoutValue(
  attrName: string,
  attrValue: string,
  textlines: string[],
  startLine: number,
): boolean {
  if (attrValue !== "") {
    return false;
  }
  for (let i = startLine; i < textlines.length; i++) {
    const line = textlines[i];
    const reg = new RegExp(`\\b${attrName}\\s*=\\s*['"].*?['"]`);
    if (reg.test(line)) {
      return false;
    }
    if (line.includes(`/>`) || line.includes(`>`)) {
      return true;
    }
  }

  throw new Error("isWithoutValue不应出现的情况");
}
