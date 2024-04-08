import type { Element } from "domhandler/lib/node.d.ts";

import * as vscode from "vscode";
import { DEFAULTWXML } from "./constant";
import type { AttributeConfig } from "./diagnosticListCache/subCompConfigCache";
import { ErrorType } from "./ErrorType";

// 将连字符(短横线)命名转换为驼峰命名
function hyphenToCamelCase<T extends string | string[]>(str: T): T {
  if (Array.isArray(str)) {
    return str.map(item => hyphenToCamelCase(item)) as T;
  } else {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase()) as T;
  }
}

/**
 * 实现对数组中连字符(短横线)命名的字符串进行分组，返回重复的字符串数组
 *  findRepeatedString( ["a-a", "aA",'x']); => [["a-a", "aA"]]
 *  findRepeatedString( ["b-b-b", "bB-b","b-bB",'x']); => [["b-b-b", "bB-b","b-bB"]]
 *  findRepeatedString( ["a-a", "aA","b-b-b", "bB-b","b-bB",'x']); => [["a-a", "aA"],["b-b-b", "bB-b","b-bB"]]
 */
function findRepeatedString(keys: string[]): string[][] {
  const map = new Map();
  for (const key of keys) {
    const camelCaseKey = hyphenToCamelCase(key);
    if (!map.has(camelCaseKey)) {
      map.set(camelCaseKey, [key]);
    } else {
      map.get(camelCaseKey).push(key);
    }
  }

  return Array.from(map.values()).filter(group => group.length > 1);
}

/**
 * 获取标签的位置所在的起始行数
 * @param wxmlTextLines
 * @param tagNameOrId
 * @param index
 * @returns
 */
export function getElementStartIndexByTag(
  wxmlTextLines: string[],
  tagNameOrId: string,
  index: number,
): number {
  // 已匹配到的标签的数量
  let elementMatchCount = 0;
  // 匹配的起始标签行数
  let startRowIndex = -1;
  let isComment = false;
  // 获取标签的位置所在的起始行数
  for (let rowIndex = 0; rowIndex < wxmlTextLines.length; rowIndex++) {
    const curlineStr = wxmlTextLines[rowIndex];

    // 判断当前行是否是注释
    if (isComment === false && curlineStr.includes("<!--")) {
      isComment = true;
    }
    // 判断注释区是否结束
    if (isComment === true && curlineStr.includes("-->")) {
      isComment = false;
      // 跳过当前行的剩余部分
      continue;
    }
    // 如果是注释区,则跳过此行
    if (isComment === true) {
      continue;
    }

    const tagMatch = curlineStr.match(`<${tagNameOrId}`);
    // 行中匹配到了标签时
    if (tagMatch !== null) {
      if (elementMatchCount === index) {
        startRowIndex = rowIndex;
        break;
      } else {
        elementMatchCount++;
      }
    }
  }

  return startRowIndex;
}

export function getElementStartIndexById(
  wxmlTextLines: string[],
  tagName: string,
  id: string,
): number {
  let tagRowIndex = -1;
  let isComment = false;
  for (let rowIndex = 0; rowIndex < wxmlTextLines.length; rowIndex++) {
    const curlineStr = wxmlTextLines[rowIndex];
    // 判断当前行是否是注释
    if (isComment === false && curlineStr.includes("<!--")) {
      isComment = true;
    }
    // 判断注释区是否结束
    if (isComment === true && curlineStr.includes("-->")) {
      isComment = false;
      // 跳过当前行的剩余部分
      continue;
    }
    // 如果是注释区,则跳过此行
    if (isComment === true) {
      continue;
    }
    const tagMatch = curlineStr.match(`<${tagName}`);
    if (tagMatch !== null) {
      tagRowIndex = rowIndex;
    }
    const idMatch = curlineStr.match(`id\\s*=\\s*["']${id}["']`);
    if (idMatch !== null) {
      return tagRowIndex;
    }
  }

  throw Error(`找不到id为${id}的元素`);
}

type Position = {
  startLine: number;
  startIndex: number;
  endIndex: number;
};

/**
 * 获取属性的位置
 * @param wxmlTextlines
 * @param attrName
 */
function getAttrPosition(wxmlTextlines: string[], attrName: string, elementStartLine: number): Position {
  // 属性名开头,中间有=号,等号后面有引号包裹内容
  const regex1 = new RegExp(`${attrName}\\s*=\\s*["'].*?["']`);
  const regex2 = new RegExp(`${attrName}\\s*=`);
  const regex3 = new RegExp(`${attrName}`);
  for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
    const line = wxmlTextlines[index];
    const match = line.match(regex1) || line.match(regex2) || line.match(regex3);
    if (match !== null) {
      return { startLine: index, startIndex: match.index!, endIndex: match.index! + match[0].length };
    }
  }

  throw new Error(`找不到属性${attrName}`);
}

function getValuePosition(
  wxmlTextlines: string[],
  attrName: string,
  errorValue: string,
  elementStartLine: number,
): Position {
  // 属性名开头,中间有=号,等号后面有引号包裹内容
  // const regex1 = new RegExp(`\\{\\{\\s*${errorValue}\\s*\\}\\}`);
  const regex = new RegExp(`${errorValue}`);
  for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
    const line = wxmlTextlines[index];
    const match = line.match(regex);
    if (match !== null) {
      return { startLine: index, startIndex: match.index!, endIndex: match.index! + match[0].length };
    }
  }

  throw new Error(`找不到属性${attrName}`);
}

export function getTagPosition(
  elementName: string,
  wxmlTextlines: string[],
  elementStartLine: number,
): Position {
  const regex = new RegExp(`<\\s*${elementName}`);
  for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
    const line = wxmlTextlines[index];
    const match = line.match(regex);
    if (match !== null) {
      return { startLine: index, startIndex: match.index!, endIndex: match.index! + match[0].length };
    }
  }

  throw new Error(`找不到元素${elementName}`);
}

function createRepeatedAttrDiagnostic(
  repeatedAttrNames: string[],
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  repeatedAttrNames.forEach((repeatedAttrName) => {
    const attrPosition = getAttrPosition(wxmlTextlines, repeatedAttrName, elementStartLine);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(
        attrPosition.startLine,
        attrPosition.startIndex,
        attrPosition.startLine,
        attrPosition.endIndex,
      ),
      `${ErrorType.repeated}: ${repeatedAttrName}`,
      vscode.DiagnosticSeverity.Error,
    );
    diagnosticList.push(diagnostic);
  });

  return diagnosticList;
}

function createMissingAttrDiagnostic(
  elementName: string,
  missingAttrNames: string[],
  wxmlTextlines: string[],
  attributeConfig: Record<string, string>,
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  missingAttrNames.forEach((attrName) => {
    const tagPosition = getTagPosition(elementName, wxmlTextlines, elementStartLine);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(
        tagPosition.startLine,
        tagPosition.startIndex,
        tagPosition.startLine,
        tagPosition.endIndex,
      ),
      `${ErrorType.missingAttributes}: ${attrName}`,
      vscode.DiagnosticSeverity.Error,
    );

    diagnostic.code = attrName.includes(":")
      ? `${attrName}="${attributeConfig[attrName]}"`
      : `${attrName}="{{${attributeConfig[attrName]}}}"`;
    diagnosticList.push(diagnostic);
  });

  return diagnosticList;
}

function createUnknownAttrDiagnostic(
  unknownAttrNames: string[],
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  unknownAttrNames.forEach((unknownAttrName) => {
    const attrPosition = getAttrPosition(wxmlTextlines, unknownAttrName, elementStartLine);
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(
        attrPosition.startLine,
        attrPosition.startIndex,
        attrPosition.startLine,
        attrPosition.endIndex,
      ),
      `${ErrorType.unknown}: ${unknownAttrName}`,
      vscode.DiagnosticSeverity.Error,
    );
    diagnosticList.push(diagnostic);
  });

  return diagnosticList;
}
createUnknownAttrDiagnostic;

function createErrorValueDiagnostic(
  eleAttrName: string,
  errorValue: string,
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic {
  const valuePosition = getValuePosition(wxmlTextlines, eleAttrName, errorValue, elementStartLine);

  return new vscode.Diagnostic(
    new vscode.Range(
      valuePosition.startLine,
      valuePosition.startIndex,
      valuePosition.startLine,
      valuePosition.endIndex,
    ),
    `${ErrorType.invalid}`,
    vscode.DiagnosticSeverity.Error,
  );
}

function whenSubCompAttrValueIsWxml(
  eleAttrName: string,
  elementAttrValue: string,
  wxmlTextlines: string[],
  elementStartLine: number,
  eleAttrValue: string,
): vscode.Diagnostic | undefined {
  // 在annil插件中, SubComponent API 的inherit字段值为wxml时,表示该属性值源自wxml中的变量(如wxml循环语句的子变量)。在修复缺少此类属性时,修复的值为DEFAULTWXML,但还是要报错提醒用户修改。
  const regex = new RegExp(`\\{\\{\\s*${DEFAULTWXML}\\s*\\}\\}`);
  if (regex.test(elementAttrValue)) {
    const diagnostic = createErrorValueDiagnostic(
      eleAttrName,
      DEFAULTWXML,
      wxmlTextlines,
      elementStartLine,
    );

    return diagnostic;
  } else {
    // 自定义的属性值中有空格或tab时报错
    if (eleAttrValue.includes(" ") || eleAttrValue.includes("\t")) {
      const diagnostic = createErrorValueDiagnostic(
        eleAttrName,
        eleAttrValue,
        wxmlTextlines,
        elementStartLine,
      );

      return diagnostic;
    }
  }
}

function getVariableAttrValueDiagnosticList(
  elementAttrValue: string,
  subCompAttrValue: string,
  eleAttrName: string,
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const regex = new RegExp(`\\{\\{\\s*(.*?)\\s*\\}\\}`);
  const match = elementAttrValue.match(regex);
  if (match === null) {
    // 不满足{{xxx}}的格式时,报错位置是elementAttrValue的位置
    const diagnostic = createErrorValueDiagnostic(
      eleAttrName,
      elementAttrValue,
      wxmlTextlines,
      elementStartLine,
    );
    // 借用code值作为传递正确的属性值，即修复时用的值
    diagnostic.code = `{{ ${subCompAttrValue === "wxml" ? DEFAULTWXML : subCompAttrValue} }}`;
    diagnosticList.push(diagnostic);

    return diagnosticList;
  }
  const eleAttrValue = match[1];
  if (subCompAttrValue === "wxml") {
    // 当预期值为wxml时
    const diagnostic = whenSubCompAttrValueIsWxml(
      eleAttrName,
      elementAttrValue,
      wxmlTextlines,
      elementStartLine,
      eleAttrValue,
    );
    if (diagnostic) {
      diagnostic.code = `${DEFAULTWXML}`;
      diagnosticList.push(diagnostic);
    }
  } else {
    // 属性值与期望值不相等时,报错位置是realAttrValue的位置
    if (eleAttrValue !== subCompAttrValue) {
      const diagnostic = createErrorValueDiagnostic(
        eleAttrName,
        eleAttrValue,
        wxmlTextlines,
        elementStartLine,
      );
      diagnostic.code = `${subCompAttrValue}`;
      diagnosticList.push(diagnostic);
    }
  }

  return diagnosticList;
}

// 收集错误属性值的诊断
function collectErrorValueDiagnostic(
  elementAttributeNameList: string[],
  elementAttributes: Record<string, string>,
  attributeConfig: AttributeConfig,
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  for (const eleAttrName of elementAttributeNameList) {
    const elementAttrValue = elementAttributes[eleAttrName];
    const subCompAttrValue = attributeConfig[hyphenToCamelCase(eleAttrName)];
    // 事件属性验证 (事件属性中包含冒号)
    if (eleAttrName.includes(":")) {
      if (elementAttrValue !== subCompAttrValue) {
        const diagnostic = createErrorValueDiagnostic(
          eleAttrName,
          elementAttrValue,
          wxmlTextlines,
          elementStartLine,
        );
        diagnostic.code = `${subCompAttrValue}`;
        diagnosticList.push(diagnostic);
      }
    } // 变量属性验证
    else {
      diagnosticList.push(...getVariableAttrValueDiagnosticList(
        elementAttrValue,
        subCompAttrValue,
        eleAttrName,
        wxmlTextlines,
        elementStartLine,
      ));
    }
  }

  return diagnosticList;
}

// 不检查的属性
const notCheckAttr = ["style", "id", "class"];

// 删除不检查的属性
function deleteUncheckAttr(elementAttributes: Record<string, string>): Record<string, string> {
  for (const eleName in elementAttributes) {
    if (notCheckAttr.includes(eleName) || eleName.includes("data-")) {
      delete elementAttributes[eleName];
    }
  }

  return elementAttributes;
}

/**
 * @param element 子组件的元素
 * @param attributeConfig 子组件的属性配置
 * @param wxmlTextlines wxml文本的每一行
 * @param index  第几个元素,id一定是0
 * @param by 元素查找方式,默认为tag,可选值为id
 * @returns
 */
export function generateElementDianosticList(
  element: Element,
  attributeConfig: AttributeConfig,
  wxmlTextlines: string[],
  elementStartLine: number,
): vscode.Diagnostic[] {
  const diagnosticList: vscode.Diagnostic[] = [];
  const elementName = element.name;
  const originalElementAttrs = element.attribs;
  // 获取元素(标签)的起始行数,提高后续查找的效率(循环时索引起始位置)

  const subCompAttributeNameList = Object.keys(attributeConfig);
  const elementAttributes = deleteUncheckAttr(originalElementAttrs);
  // 获取所有要验证的属性名
  let elementAttributeNameList = Object.keys(elementAttributes);
  // 缺少的属性名的诊断
  const missingAttributeNames = subCompAttributeNameList.filter(
    subCompAttributeName => !hyphenToCamelCase(elementAttributeNameList).includes(subCompAttributeName),
  );
  if (missingAttributeNames.length > 0) {
    diagnosticList.push(
      ...createMissingAttrDiagnostic(
        elementName,
        missingAttributeNames,
        wxmlTextlines,
        attributeConfig,
        elementStartLine,
      ),
    );
  }
  // 获取重复的属性(连字符命名属性转为驼峰命名属性后,所有重复的属性名去除最后一位,剩余的算重复属性名,如: ["a-a", "aA"] => ["a-a"], ["b-b-b", "bB-b","b-bB"] => ["b-b-b", "bB-b"])
  const repeatedAttributeNames = findRepeatedString(elementAttributeNameList).flatMap(duplicateNames =>
    duplicateNames.slice(0, -1)
  );

  if (repeatedAttributeNames.length > 0) {
    diagnosticList.push(
      ...createRepeatedAttrDiagnostic(
        repeatedAttributeNames,
        wxmlTextlines,
        elementStartLine,
      ),
    );
  }
  // 获取elementAttributeNameList中有而subCompAttributeNameList中没有的属性名
  const unknownNameList: string[] = [];
  elementAttributeNameList = elementAttributeNameList.filter(item => {
    // 去除重复的属性名
    if (repeatedAttributeNames.includes(item)) {
      return false;
    }
    // 去除未知的属性名
    if (!subCompAttributeNameList.includes(hyphenToCamelCase(item))) {
      unknownNameList.push(item);

      return false;
    }

    return true;
  });
  // 建立未知属性的诊断
  diagnosticList.push(
    ...createUnknownAttrDiagnostic(
      unknownNameList,
      wxmlTextlines,
      elementStartLine,
    ),
  );

  // 收集错误属性值的诊断
  diagnosticList.push(
    ...collectErrorValueDiagnostic(
      elementAttributeNameList,
      elementAttributes,
      attributeConfig,
      wxmlTextlines,
      elementStartLine,
    ),
  );

  return diagnosticList;
}
