export function isWithoutValue(
  attrName: string,
  textlines: string[],
  startLine: number,
): boolean {
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
  // console.log("isWithoutValue不应出现的情况", textlines, startLine, attrName);
  throw new Error("isWithoutValue不应出现的情况");
}
