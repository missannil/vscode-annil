// /* eslint-disable complexity */
// import type { Element } from "domhandler/lib/node.d.ts";

// import * as vscode from "vscode";
// import { DEFAULTWXML, TERNARY } from "./constant";
// import type { AttributeConfig, AttributeValue } from "./diagnosticListCache/subCompConfigCache";
// import { ErrorType } from "./ErrorType";

// // 将连字符(短横线)命名转换为驼峰命名
// function hyphenToCamelCase<T extends string | string[]>(str: T): T {
//   if (Array.isArray(str)) {
//     return str.map((item) => hyphenToCamelCase(item)) as T;
//   } else {
//     return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as T;
//   }
// }

// /**
//  *  找到数组中连字符字符串与驼峰命名等效的字符串组并返回
//  *  findRepeatedString( ["a-a", "aA",'x']); => [["a-a", "aA"]]
//  *  findRepeatedString( ["b-b-b", "bB-b","b-bB",'x']); => [["b-b-b", "bB-b","b-bB"]]
//  *  findRepeatedString( ["a-a", "aA","b-b-b", "bB-b","b-bB",'x']); => [["a-a", "aA"],["b-b-b", "bB-b","b-bB"]]
//  */
// function findRepeatedString(keys: string[]): string[][] {
//   const map = new Map();
//   for (const key of keys) {
//     const camelCaseKey = hyphenToCamelCase(key);
//     if (!map.has(camelCaseKey)) {
//       map.set(camelCaseKey, [key]);
//     } else {
//       map.get(camelCaseKey).push(key);
//     }
//   }

//   return Array.from(map.values()).filter((group) => group.length > 1);
// }

// /**
//  * 获取标签的位置所在的起始行数
//  * @param wxmlTextLines
//  * @param tagNameOrId
//  * @param index
//  * @returns
//  */
// export function getElementStartIndexByTag(
//   wxmlTextLines: string[],
//   tagNameOrId: string,
//   index: number,
// ): number {
//   // 已匹配到的标签的数量
//   let elementMatchCount = 0;
//   // 匹配的起始标签行数
//   let startRowIndex = -1;
//   let isComment = false;
//   // 获取标签的位置所在的起始行数
//   for (let rowIndex = 0; rowIndex < wxmlTextLines.length; rowIndex++) {
//     const curlineStr = wxmlTextLines[rowIndex];

//     // 判断当前行是否是注释
//     if (isComment === false && curlineStr.includes("<!--")) {
//       isComment = true;
//     }
//     // 判断注释区是否结束
//     if (isComment === true && curlineStr.includes("-->")) {
//       isComment = false;
//       // 跳过当前行的剩余部分
//       continue;
//     }
//     // 如果是注释区,则跳过此行
//     if (isComment === true) {
//       continue;
//     }

//     const tagMatch = curlineStr.match(`<${tagNameOrId}`);
//     // 行中匹配到了标签时
//     if (tagMatch !== null) {
//       if (elementMatchCount === index) {
//         startRowIndex = rowIndex;
//         break;
//       } else {
//         elementMatchCount++;
//       }
//     }
//   }

//   return startRowIndex;
// }

// export function getElementStartIndexById(
//   wxmlTextLines: string[],
//   tagName: string,
//   id: string,
// ): number {
//   let tagRowIndex = -1;
//   let isComment = false;
//   for (let rowIndex = 0; rowIndex < wxmlTextLines.length; rowIndex++) {
//     const curlineStr = wxmlTextLines[rowIndex];
//     // 判断当前行是否是注释
//     if (isComment === false && curlineStr.includes("<!--")) {
//       isComment = true;
//     }
//     // 判断注释区是否结束
//     if (isComment === true && curlineStr.includes("-->")) {
//       isComment = false;
//       // 跳过当前行的剩余部分
//       continue;
//     }
//     // 如果是注释区,则跳过此行
//     if (isComment === true) {
//       continue;
//     }
//     const tagMatch = curlineStr.match(`<${tagName}`);
//     if (tagMatch !== null) {
//       tagRowIndex = rowIndex;
//     }
//     const idMatch = curlineStr.match(`id\\s*=\\s*["']${id}["']`);
//     if (idMatch !== null) {
//       return tagRowIndex;
//     }
//   }

//   throw Error(`找不到id为${id}的元素`);
// }

// type Position = {
//   startLine: number;
//   startIndex: number;
//   endIndex: number;
// };

// /**
//  * 获取属性的位置
//  * @param wxmlTextlines
//  * @param attrName
//  */
// function getAttrPosition(
//   wxmlTextlines: string[],
//   attrName: string,
//   elementStartLine: number,
// ): Position {
//   // 属性名开头,中间有=号,等号后面有引号包裹内容
//   const regex1 = new RegExp(`${attrName}\\s*=\\s*["'].*?["']`);
//   const regex2 = new RegExp(`${attrName}\\s*=`);
//   const regex3 = new RegExp(`${attrName}`);
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];
//     const match = line.match(regex1) || line.match(regex2) || line.match(regex3);
//     if (match !== null) {
//       return {
//         startLine: index,
//         startIndex: match.index!,
//         endIndex: match.index! + match[0].length,
//       };
//     }
//   }

//   throw new Error(`找不到属性${attrName}`);
// }

// // 获取属性整体字符串的位置 与其他的边界是空格
// function getPositionOfAllAttrCharacter(
//   wxmlTextlines: string[],
//   attrName: string,
//   elementStartLine: number,
// ): Position {
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];

//     const match = line.match(
//       new RegExp(`${attrName}(\\s*?=\\s*?[\\"'][^"]*[\\"'])?`),
//     );
//     if (match === null) {
//       continue;
//     }

//     return {
//       startLine: index,
//       startIndex: match.index!,
//       endIndex: match.index! + match[0].length,
//     };
//   }
//   throw new Error(`找不到属性${attrName}`);
// }

// // 把特殊字符转义为普通字符
// function escapeSpecialCharacter(str: string): string {
//   return str.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
// }
// // function getAllValuePosition(
// //   wxmlTextlines: string[],
// //   attrName: string,
// //   errorValue: string,
// //   elementStartLine: number
// // ): Position {
// //   errorValue = errorValue.replace(/([?:])/g, "\\$1");

// //   // const regex = new RegExp(`${errorValue}`);
// //   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
// //     const line = wxmlTextlines[index];
// //     const match = line.match(
// //       new RegExp(`\\s*${attrName}\\s*=\\s*["']${errorValue}["']`)
// //     );
// //     if (match === null) {
// //       continue;
// //     } else {
// //       const match = line.match(errorValue)!;

// //       return {
// //         startLine: index,
// //         startIndex: match.index!,
// //         endIndex: match.index! + errorValue.length,
// //       };
// //     }
// //   }
// //   throw new Error(`找不到属性${attrName}`);
// // }
// function getErrorValuePositionOfEventAttrName(
//   wxmlTextlines: string[],
//   attrName: string,
//   errorValue: string,
//   elementStartLine: number,
// ): Position {
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];
//     //  匹配全属性字符串的正则表达式
//     const allAttrMatch = line.match(
//       new RegExp(`${attrName}\\s*=\\s*["']${escapeSpecialCharacter(errorValue)}["']`),
//     );
//     if (allAttrMatch === null) {
//       continue;
//     } // 在全字符串基础上匹配错误属性值(避免其他行有相同错误属性值的字符被匹配)
//     else {
//       const regex = new RegExp(`(?<=["'])(${escapeSpecialCharacter(errorValue)})(?=["'])`);
//       const match = allAttrMatch[0].match(regex)!;

//       return {
//         startLine: index,
//         startIndex: allAttrMatch.index! + match.index!,
//         endIndex: allAttrMatch.index! + match.index! + errorValue.length,
//       };
//     }
//   }
//   throw new Error(`找不到错误属性值${errorValue}`);
// }

// function getErrorValuePositionOfTernaryExpression(
//   wxmlTextlines: string[],
//   attrName: string,
//   errorValue: string,
//   elementStartLine: number,
// ): Position {
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];
//     const allAttrMatch = line.match(
//       new RegExp(
//         `${attrName}\\s*=\\s*["']\\s*\\{\\{.*((?<=\\?|:)\\s*${errorValue}).*\\}\\}\\s*["']`,
//       ),
//     );
//     if (allAttrMatch === null) {
//       continue;
//     } else {
//       const regex = new RegExp(`(?<=\\?\\s*|:\\s*)${errorValue}`);
//       const match = allAttrMatch[0].match(regex)!;

//       return {
//         startLine: index,
//         startIndex: allAttrMatch.index! + match.index!,
//         endIndex: allAttrMatch.index! + match.index! + errorValue.length,
//       };
//     }
//   }
//   throw new Error(`找不到属性${attrName}`);
// }

// function getErrorValuePositionOfNonEventAttrName(
//   wxmlTextlines: string[],
//   attrName: string,
//   errorValue: string,
//   elementStartLine: number,
// ): Position {
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];
//     const allAttrMatch = line.match(
//       new RegExp(
//         `${attrName}\\s*=\\s*["']\\s*\\{\\{\\s*${escapeSpecialCharacter(errorValue)}\\s*\\}\\}\\s*["']`,
//       ),
//     );
//     if (allAttrMatch === null) {
//       continue;
//     } else {
//       const regex = new RegExp(`(?<=\\{\\{\\s*)${escapeSpecialCharacter(errorValue)}(?=\\s*\\}\\})`);
//       const match = allAttrMatch[0].match(regex)!;

//       return {
//         startLine: index,
//         startIndex: allAttrMatch.index! + match.index!,
//         endIndex: allAttrMatch.index! + match.index! + errorValue.length,
//       };
//     }
//   }
//   throw new Error(`找不到属性${attrName}`);
// }

// export function getTagPosition(
//   elementName: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): Position {
//   const regex = new RegExp(`<\\s*${elementName}`);
//   for (let index = elementStartLine; index < wxmlTextlines.length; index++) {
//     const line = wxmlTextlines[index];
//     const match = line.match(regex);
//     if (match !== null) {
//       return {
//         startLine: index,
//         startIndex: match.index!,
//         endIndex: match.index! + match[0].length,
//       };
//     }
//   }

//   throw new Error(`找不到元素${elementName}`);
// }

// function createDiagnosticOfRepeatedAttrName(
//   repeatedAttrNames: string[],
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];

//   repeatedAttrNames.forEach((repeatedAttrName) => {
//     const attrPosition = getAttrPosition(
//       wxmlTextlines,
//       repeatedAttrName,
//       elementStartLine,
//     );
//     const diagnostic = new vscode.Diagnostic(
//       new vscode.Range(
//         attrPosition.startLine,
//         attrPosition.startIndex,
//         attrPosition.startLine,
//         attrPosition.endIndex,
//       ),
//       `${ErrorType.repeated}: ${repeatedAttrName}`,
//       vscode.DiagnosticSeverity.Error,
//     );
//     diagnosticList.push(diagnostic);
//   });

//   return diagnosticList;
// }

// function createDiagnosticOfUnknownAttrName(
//   unknownAttrNames: string[],
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];
//   unknownAttrNames.forEach((unknownAttrName) => {
//     const attrPosition = getAttrPosition(
//       wxmlTextlines,
//       unknownAttrName,
//       elementStartLine,
//     );
//     const diagnostic = new vscode.Diagnostic(
//       new vscode.Range(
//         attrPosition.startLine,
//         attrPosition.startIndex,
//         attrPosition.startLine,
//         attrPosition.endIndex,
//       ),
//       `${ErrorType.unknown}: ${unknownAttrName}`,
//       vscode.DiagnosticSeverity.Error,
//     );
//     diagnosticList.push(diagnostic);
//   });

//   return diagnosticList;
// }

// function createDiagnosticOfAllAttrCharacter(
//   eleAttrName: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic {
//   const valuePosition = getPositionOfAllAttrCharacter(
//     wxmlTextlines,
//     eleAttrName,
//     elementStartLine,
//   );

//   return new vscode.Diagnostic(
//     new vscode.Range(
//       valuePosition.startLine,
//       valuePosition.startIndex,
//       valuePosition.startLine,
//       valuePosition.endIndex,
//     ),
//     `${ErrorType.empty}`,
//     vscode.DiagnosticSeverity.Error,
//   );
// }

// function createErrorValueDiagnosticOfTernaryExpression(
//   eleAttrName: string,
//   errorValue: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic {
//   const valuePosition = getErrorValuePositionOfTernaryExpression(
//     wxmlTextlines,
//     eleAttrName,
//     errorValue,
//     elementStartLine,
//   );

//   return new vscode.Diagnostic(
//     new vscode.Range(
//       valuePosition.startLine,
//       valuePosition.startIndex,
//       valuePosition.startLine,
//       valuePosition.endIndex,
//     ),
//     `${ErrorType.invalid}`,
//     vscode.DiagnosticSeverity.Error,
//   );
// }

// function createErrorValueDiagnosticOfNonEventAttrName(
//   eleAttrName: string,
//   errorValue: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic {
//   const valuePosition = getErrorValuePositionOfNonEventAttrName(
//     wxmlTextlines,
//     eleAttrName,
//     errorValue,
//     elementStartLine,
//   );

//   return new vscode.Diagnostic(
//     new vscode.Range(
//       valuePosition.startLine,
//       valuePosition.startIndex,
//       valuePosition.startLine,
//       valuePosition.endIndex,
//     ),
//     `${ErrorType.invalid}`,
//     vscode.DiagnosticSeverity.Error,
//   );
// }

// function isTernaryExpression(expression: string): boolean {
//   const ternaryPattern = /[^?]+\?[^:]+:[^:]+/;

//   return ternaryPattern.test(expression);
// }

// function extractOuterTernary(expression: string): [string, string] {
//   let questionMarkCount = 0;
//   let colonCount = 0;
//   let questionMarkIndex = -1;
//   let colonIndex = -1;

//   for (let i = 0; i < expression.length; i++) {
//     if (expression[i] === "?") {
//       questionMarkCount++;
//       if (questionMarkCount === 1) {
//         questionMarkIndex = i;
//       }
//     } else if (expression[i] === ":") {
//       colonCount++;
//       if (questionMarkCount === colonCount) {
//         colonIndex = i;
//         break;
//       }
//     }
//   }

//   const trueValue = expression
//     .substring(questionMarkIndex + 1, colonIndex)
//     .trim();
//   const falseValue = expression.substring(colonIndex + 1).trim();

//   return [trueValue, falseValue];
// }

// // 解析字符串表达式可能的值(三元表达式字符串可能有多个值,如: "a?b:c" => ["b", "c"])
// function parseExpressionValues(
//   expression: string,
//   values: string[] = [],
// ): string[] {
//   // 判断表达式是否是三元表达式
//   if (!isTernaryExpression(expression)) {
//     values.push(expression);
//   } else {
//     // 获取三元表达式第一个问号后面到最后一个冒号之前的表达式为正确的表达式,最后一个冒号后面的表达式为错误的表达式
//     const [trueValue, falseValue] = extractOuterTernary(expression);
//     parseExpressionValues(trueValue, values);
//     parseExpressionValues(falseValue, values);
//   }

//   return values;
// }

// function isEventAttr(attrName: string): boolean {
//   return attrName.includes(":");
// }

// function generateDiagnosticsOfEventAttrValue(
//   elementAttrValueStr: string,
//   subCompAttrValue: string,
//   eleAttrName: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic | undefined {
//   // 无值处理。例如 <button bind:yyy /> or <button bind:xxx=""></button> 诊断在全属性上
//   if (elementAttrValueStr === "") {
//     const valuePosition = getPositionOfAllAttrCharacter(
//       wxmlTextlines,
//       eleAttrName,
//       elementStartLine,
//     );

//     const diagnostic = new vscode.Diagnostic(
//       new vscode.Range(
//         valuePosition.startLine,
//         valuePosition.startIndex,
//         valuePosition.startLine,
//         valuePosition.endIndex,
//       ),
//       `${ErrorType.empty}`,
//       vscode.DiagnosticSeverity.Error,
//     );
//     // 修复是标记位置替换的内容
//     diagnostic.code = `${eleAttrName}="${subCompAttrValue}"`;

//     return diagnostic;
//   } // 有值处理,诊断在值上
//   else if (elementAttrValueStr !== subCompAttrValue) {
//     const valuePosition = getErrorValuePositionOfEventAttrName(
//       wxmlTextlines,
//       eleAttrName,
//       elementAttrValueStr,
//       elementStartLine,
//     );

//     const diagnostic = new vscode.Diagnostic(
//       new vscode.Range(
//         valuePosition.startLine,
//         valuePosition.startIndex,
//         valuePosition.startLine,
//         valuePosition.endIndex,
//       ),
//       `${ErrorType.invalid}`,
//       vscode.DiagnosticSeverity.Error,
//     );
//     // 修复是标记位置替换的内容
//     diagnostic.code = subCompAttrValue as string;

//     return diagnostic;
//   }
// }

// function hasMeaninglessSpace(str: string): boolean {
//   // 字符串是否只包含空格 或 字符串中是否存在无意义的空格(即空格前后都不是点的情况)。
//   return str.trim() === "" || /[^\\.]\s[^\\.]/.test(str);
// }

// function generateDiagnosticsOfNonEventAttrValue(
//   elementAttrValueStr: string,
//   subCompAttrValue: AttributeValue,
//   eleAttrName: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];
//   const mustacheMatch = elementAttrValueStr.match(/\{\{(.*?)\}\}/);
//   // 无效值(不满足大胡子语法或值为空串) 例如: `<button xxx />` 或 `<button xxx="">` 或 `<button xxx="{{}" />`或 `<button xxx="{{}}" />`
//   if (mustacheMatch === null || mustacheMatch[1] === "") {
//     const diagnostic = createDiagnosticOfAllAttrCharacter(
//       eleAttrName,
//       wxmlTextlines,
//       elementStartLine,
//     );
//     diagnostic.code = `${eleAttrName}="{{ ${
//       subCompAttrValue === "wxml" ? DEFAULTWXML : Array.isArray(subCompAttrValue) ? TERNARY : subCompAttrValue
//     } }}"`;
//     diagnosticList.push(diagnostic);

//     return diagnosticList;
//   }
//   // 有效值的情况 例如: `<button xxx="{{ yyy }}" />` 或 `<button xxx="{{  }}" />`
//   const elementAttrValue = mustacheMatch[1].trim() === "" ? mustacheMatch[1] : mustacheMatch[1].trim();
//   // 诊断特例: 预期为wxml时
//   if (subCompAttrValue === "wxml") {
//     // 值为DEFAULTWXML或空串时或错误的语法,报错
//     if (elementAttrValue === DEFAULTWXML || hasMeaninglessSpace(elementAttrValue)) {
//       const diagnostic = createErrorValueDiagnosticOfNonEventAttrName(
//         eleAttrName,
//         elementAttrValue,
//         wxmlTextlines,
//         elementStartLine,
//       );
//       diagnostic.code = DEFAULTWXML;
//       diagnosticList.push(diagnostic);
//     }

//     return diagnosticList;
//   }
//   if (Array.isArray(subCompAttrValue)) {
//     if (!isTernaryExpression(elementAttrValue)) {
//       // 当前值不是三元表达式时报整体值错误
//       const diagnostic = createErrorValueDiagnosticOfNonEventAttrName(
//         eleAttrName,
//         elementAttrValue,
//         wxmlTextlines,
//         elementStartLine,
//       );
//       diagnostic.code = TERNARY;
//       diagnosticList.push(diagnostic);
//     } else {
//       // 是三元表达式时,分别检查(报错)
//       const eleAttrValueList = parseExpressionValues(elementAttrValue);
//       if (eleAttrValueList.length !== subCompAttrValue.length) {
//         const diagnostic = createErrorValueDiagnosticOfNonEventAttrName(
//           eleAttrName,
//           elementAttrValue,
//           wxmlTextlines,
//           elementStartLine,
//         );
//         diagnostic.code = TERNARY;
//         diagnosticList.push(diagnostic);
//       } else {
//         for (let index = 0; index < eleAttrValueList.length; index++) {
//           if (eleAttrValueList[index] !== subCompAttrValue[index]) {
//             const diagnostic = createErrorValueDiagnosticOfTernaryExpression(
//               eleAttrName,
//               eleAttrValueList[index],
//               wxmlTextlines,
//               elementStartLine,
//             );
//             diagnostic.code = subCompAttrValue[index];
//             diagnosticList.push(diagnostic);
//           }
//         }
//       }
//     }

//     return diagnosticList;
//   }
//   if (elementAttrValue !== subCompAttrValue) {
//     const diagnostic = createErrorValueDiagnosticOfNonEventAttrName(
//       eleAttrName,
//       elementAttrValue,
//       wxmlTextlines,
//       elementStartLine,
//     );
//     diagnostic.code = subCompAttrValue;
//     diagnosticList.push(diagnostic);
//   }

//   return diagnosticList;
// }

// // 收集错误属性值的诊断
// function getDiagnosisOfAttrValueError(
//   elementAttributes: Element["attribs"],
//   attributeConfig: AttributeConfig,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];
//   for (const eleAttrName in elementAttributes) {
//     const elementAttrValueStr = elementAttributes[eleAttrName];
//     const subCompAttrValue = attributeConfig[hyphenToCamelCase(eleAttrName)];
//     if (isEventAttr(eleAttrName)) {
//       const diagnostic = generateDiagnosticsOfEventAttrValue(
//         elementAttrValueStr,
//         subCompAttrValue as string,
//         eleAttrName,
//         wxmlTextlines,
//         elementStartLine,
//       );
//       diagnostic && diagnosticList.push(diagnostic);
//     } else {
//       const diagnostic = generateDiagnosticsOfNonEventAttrValue(
//         elementAttrValueStr,
//         subCompAttrValue,
//         eleAttrName,
//         wxmlTextlines,
//         elementStartLine,
//       );
//       diagnosticList.push(...diagnostic);
//     }
//   }

//   return diagnosticList;
// }

// // 不检查的属性
// const notCheckAttr = ["style", "id", "class"];

// // 删除不检查的属性
// function deleteUncheckAttr(
//   elementAttributes: Record<string, string>,
// ): Record<string, string> {
//   for (const eleName in elementAttributes) {
//     if (notCheckAttr.includes(eleName) || eleName.includes("data-")) {
//       delete elementAttributes[eleName];
//     }
//   }

//   return elementAttributes;
// }

// function createDiagnosticOfMissingAttrName(
//   elementName: string,
//   wxmlTextlines: string[],
//   elementStartLine: number,
//   attributeConfig: AttributeConfig,
//   subCompAttrNames: string[],
//   elementAttrNames: string[],
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];
//   const missingAttrNames = subCompAttrNames.filter(
//     (subCompAttrName) => !hyphenToCamelCase(elementAttrNames).includes(subCompAttrName),
//   );
//   if (missingAttrNames.length > 0) {
//     missingAttrNames.forEach((attrName) => {
//       const tagPosition = getTagPosition(
//         elementName,
//         wxmlTextlines,
//         elementStartLine,
//       );
//       const diagnostic = new vscode.Diagnostic(
//         new vscode.Range(
//           tagPosition.startLine,
//           tagPosition.startIndex,
//           tagPosition.startLine,
//           tagPosition.endIndex,
//         ),
//         `${ErrorType.missingAttributes}: ${attrName}`,
//         vscode.DiagnosticSeverity.Error,
//       );

//       const expectedValue = attributeConfig[attrName];
//       diagnostic.code = attrName.includes(":")
//         ? `${attrName}="${expectedValue}"`
//         : `${attrName}="{{${
//           expectedValue === "wxml"
//             ? DEFAULTWXML
//             : Array.isArray(expectedValue)
//             ? TERNARY
//             : expectedValue
//         }}}"`;
//       diagnosticList.push(diagnostic);
//     });
//   }

//   return diagnosticList;
// }

// function getUnknownNames(
//   elementAttrNames: string[],
//   subCompAttrNames: string[],
// ): string[] {
//   return elementAttrNames.flatMap((elementAttrName) => {
//     if (!subCompAttrNames.includes(hyphenToCamelCase(elementAttrName))) {
//       return [elementAttrName];
//     }

//     return [];
//   });
// }

// /**
//  * @param element 子组件的元素
//  * @param attributeConfig 子组件的属性配置
//  * @param wxmlTextlines wxml文本的每一行
//  * @param index  第几个元素,id一定是0
//  * @param by 元素查找方式,默认为tag,可选值为id
//  * @returns
//  */
// export function generateElementDianosticList(
//   element: Element,
//   attributeConfig: AttributeConfig,
//   wxmlTextlines: string[],
//   elementStartLine: number,
// ): vscode.Diagnostic[] {
//   const diagnosticList: vscode.Diagnostic[] = [];
//   const checkElementAttr = deleteUncheckAttr(element.attribs);
//   const elementAttrNames = Object.keys(checkElementAttr);
//   const subCompAttrNames = Object.keys(attributeConfig);
//   // 1. 生成缺少的属性的诊断
//   diagnosticList.push(
//     ...createDiagnosticOfMissingAttrName(
//       element.name,
//       wxmlTextlines,
//       elementStartLine,
//       attributeConfig,
//       subCompAttrNames,
//       elementAttrNames,
//     ),
//   );
//   // 2. 生成重复的属性(连字符命名属性转为驼峰命名属性后,所有重复的属性名去除最后一位,剩余的为重复属性名,如: ["a-a", "aA"] => ["a-a"], ["b-b-b", "bB-b","b-bB"] => ["b-b-b", "bB-b"])
//   const repeatedAttrNames = findRepeatedString(elementAttrNames).flatMap(
//     (duplicateNames) => duplicateNames.slice(0, -1),
//   );
//   diagnosticList.push(
//     ...createDiagnosticOfRepeatedAttrName(
//       repeatedAttrNames,
//       wxmlTextlines,
//       elementStartLine,
//     ),
//   );
//   // 3. 生成未知属性的诊断
//   const unknownNames = getUnknownNames(elementAttrNames, subCompAttrNames);
//   diagnosticList.push(
//     ...createDiagnosticOfUnknownAttrName(
//       unknownNames,
//       wxmlTextlines,
//       elementStartLine,
//     ),
//   );

//   // 4.剩余(去除重复和未知项)属性值错误的诊断
//   unknownNames.forEach((unknownName) => {
//     delete checkElementAttr[unknownName];
//   });
//   repeatedAttrNames.forEach((repeatedAttrName) => {
//     delete checkElementAttr[repeatedAttrName];
//   });
//   diagnosticList.push(
//     ...getDiagnosisOfAttrValueError(
//       checkElementAttr,
//       attributeConfig,
//       wxmlTextlines,
//       elementStartLine,
//     ),
//   );

//   return diagnosticList;
// }
