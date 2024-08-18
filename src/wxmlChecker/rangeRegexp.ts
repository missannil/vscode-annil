import { escapeSpecialCharacter } from "../utils/escapeSpecialCharacter";

class RangeRegexp {
  public getFullValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(`(?<=\\b${attrName}\\s*=\\s*['"])${escapeSpecialCharacter(attrValue)}(?=['"](?=\\s|>|/>|$))`),
    ];
  }
  public getFullAttrRegexp(attrName: string): RegExp[] {
    return [
      // // class="flex-auto  w-1F5"
      // new RegExp(`\\b${attrName}\\s*=\\s*['"].*['"](?=\\s|>|/>|$)`),
      // // class=123
      // new RegExp(`\\b${attrName}\\s*=\\s*[^=\\s/>]+?(?=\\s|>|/>|$)`),
      // // class=
      // new RegExp(`\\b${attrName}\\s*=(?=\\s|>|/>|$)`),
      // // class
      // new RegExp(`\\b${attrName}(?=\\s|>|/>|$)`),
      new RegExp(`\\b${attrName}(\\s*=\\s*(['"].*?['"]|[^=\\s/>]*))?(?=\\s|>|/>|$)`),
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
  public getTernaryValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(
        `(?<=\\b${attrName}\\b\\s*=\\s*['"]\\s*{{.*[\\?:]\\s*)(\\b${attrValue}\\b)(?=.*}}\\s*['"])`,
      ), // (?=\\s*:\\s*[^}]+}}
    ];
  }
  public getImportLineRegexp(importedComponentName: string): RegExp[] {
    return [new RegExp(`"${importedComponentName}"\\s*:\\s*".*",?`)];
  }
  public getImportPathRegexp(componentName: string, componentPath: string): RegExp[] {
    return [new RegExp(`(?<="${componentName}"\\s*:\\s*)"${componentPath}",?`)];
  }
}

export const rangeRegexp = new RangeRegexp();
