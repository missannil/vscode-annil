import { escapeSpecialCharacter } from "../utils/escapeSpecialCharacter";

class RangeRegexp {
  public getFullValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(`(?<=\\b${attrName}\\s*=\\s*['"])${escapeSpecialCharacter(attrValue)}(?=['"](?=\\s|>|/>|$))`),
    ];
  }
  public getFullAttrRegexp(attrName: string): RegExp[] {
    return [
      new RegExp(`\\b${attrName}\\s*=\\s*[^=\\s/>]+?(?=\\s|>|/>|$)`),
      new RegExp(`\\b${attrName}\\s*=(?=\\s|>|/>|$)`),
      new RegExp(`\\b${attrName}(?=\\s|>|/>|$)`),
    ];
  }
  public getPreValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(
        `(?<=\\b${attrName}\\s*=\\s*['"]\\s*)${attrValue}(?={{\\s*.*\\s*}}\\s*['"](?=\\s|>|/>|$))`,
      ),
    ];
  }
  public getTagNameRegexp(tagName: string): RegExp[] {
    return [new RegExp(`<${tagName}(?=\\s|>|$)`)];
  }
  public getMustacheValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(
        `(?<=\\b${attrName}\\s*=\\s*['"]\\s*{{\\s*)${attrValue}(?=\\s*}}\\s*['"](?=\\s|>|/>|$))`,
      ),
    ];
  }
}

export const rangeRegexp = new RangeRegexp();
