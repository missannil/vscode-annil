function escapeSpecialCharacter(str: string): string {
  return str.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
}
class RangeRegexp {
  public getFullValueRegexp(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(`(?<=\\b${attrName}\\s*=\\s*['"])${escapeSpecialCharacter(attrValue)}(?=['"](?=\\s|>|/>|$))`),
    ];
  }
  // 获取一个属性完整的字段 aaa="any value" 或者 aaa 或者 aaa=
  public getFullAttrRegexp(attrName: string): RegExp[] {
    return [
      new RegExp(`\\b${attrName}(\\s*=\\s*(["'])((?:(?!\\2).|\\\\["'])*)\\2)?(?=\\s|>|/>|$)`),
      // new RegExp(`\\b${attrName}(\\s*=\\s*(['"].*?['"]|[^=\\s/>]*))?(?=\\s|>|/>|$)`),
    ];
  }
  public getTagNameRegexp(tagName: string): RegExp[] {
    return [new RegExp(`<${tagName}(?=\\s|>|$)`)];
  }
  public getFullMustacheValue(attrName: string, attrValue: string): RegExp[] {
    return [
      new RegExp(
        `(?<=\\b${attrName}\\s*=\\s*['"][^'"]*{{\\s*[^}]*?)${escapeSpecialCharacter(attrValue)}(?=[^}]*}}[^'"]*['"])`,
      ),
    ];
  }

  public getMustacheValue(attrValue: string, attrName?: string): RegExp[] {
    return [
      attrName !== undefined
        ? new RegExp(
          `(?<=\\b${attrName}\\s*=\\s*['"][^'"]*{{\\s*[^}]*)(?<!\\w)${
            escapeSpecialCharacter(attrValue)
          }(?!\\w)(?=[^}]*}}[^'"]*['"](?:\\s|>|/>|$))`,
        )
        : new RegExp(
          `(?<={{\\s*[^}]*)(?<![\\w$])${escapeSpecialCharacter(attrValue)}(?![\\w$])(?=[^}]*}})`,
        ),
    ];
  }
  /**
   * 匹配三元表达式的真分支（? 后面的值）
   * @param attrName 属性名（如 "class"）
   * @param attrValue 要匹配的值（如 "active"）
   * @returns 匹配真分支的正则表达式
   */
  public getTrueBranchRegexp(attrValue: string, attrName?: string): RegExp[] {
    return [
      new RegExp(
        attrName !== undefined
          ? `(?<=\\b${attrName}\\b\\s*=\\s*['"]\\s*{{.*\\?\\s*)(\\b${attrValue}\\b)(?=\\s*:\\s*[^}]+\\s*}}\\s*['"])`
          : `(?<=\\b{{.*\\?\\s*)(\\b${attrValue}\\b)(?=\\s*:\\s*[^}]+\\s*}})`,
      ),
    ];
  }
  /**
   * 匹配三元表达式的假分支（: 后面的值）
   * @param attrName 属性名（如 "class"）
   * @param attrValue 要匹配的值（如 "inactive"）
   * @returns 匹配假分支的正则表达式
   */
  public getFalseBranchRegexp(attrValue: string, attrName?: string): RegExp[] {
    if (attrName !== undefined) {
      return [
        new RegExp(
          `(?<=\\b${attrName}\\b\\s*=\\s*['"]\\s*{{.*:\\s*)(\\b${attrValue}\\b)(?=\\s*}}\\s*['"])`,
        ),
      ];
    } else {
      return [
        new RegExp(
          `(?<=\\b{{.*:\\s*)(\\b${attrValue}\\b)(?=\\s*}})`,
        ),
      ];
    }
  }
  public getImportLineRegexp(importedComponentName: string): RegExp[] {
    return [new RegExp(`"${importedComponentName}"\\s*:\\s*".*",?`)];
  }
  public getImportPathRegexp(componentName: string, componentPath: string): RegExp[] {
    return [new RegExp(`(?<="${componentName}"\\s*:\\s*)"${componentPath}",?`)];
  }
}

export const regexpHelper = new RangeRegexp();
