// import * as vscode from "vscode";
// import { DiagnosticErrorType, type WithoutValue } from "../diagnosticFixProvider/errorType";
// import { isWithoutValue } from "../utils/isWithoutValue";
// import { generateDiagnostic } from "./generateDiagnostic";
// import { rangeRegexp } from "./rangeRegexp";

// /**
//  * 空值错误检查, 有错误修复为有值错误,返回false, 无错误返回true
//  * 注意: wx:else无值是正常的
//  */
// function checkWithoutValue(
//   tagName: string,
//   rawAttrName: string,
//   rawAttrValue: string,
//   wxmlTextlines: string[],
//   startLine: number,
//   isMustacheSyntax: boolean,
//   diagnosticList: vscode.Diagnostic[],
// ): boolean {
//   if (isWithoutValue(tagName, rawAttrName, rawAttrValue, wxmlTextlines, startLine)) {
//     if (rawAttrName === "wx:else") return true; // wx:else无值是正常的
//     // 无值错误修复成为有值错误
//     let fixCode = "";
//     if (isMustacheSyntax) {
//       fixCode = `${rawAttrName}="{{变量名}}"`;
//     } else {
//       fixCode = `${rawAttrName}="变量名"`;
//     }
//     // 传fixCode字段
//     diagnosticList.push(
//       generateDiagnostic(
//         rangeRegexp.getFullAttrRegexp(rawAttrName),
//         `${DiagnosticErrorType.withoutValue}:${rawAttrName}` satisfies WithoutValue,
//         wxmlTextlines,
//         startLine,
//         fixCode,
//       ),
//     );

//     return false;
//   }

//   return true;
// }

// /**
//  * 检查属性的值是否正常, 返回boolean
//  * 值的类型有: 变量字符串, 运算表达式,三元表达式,前面的混合表达式
//  */
// export function checkValue(
//   tagName: string,
//   rawAttrName: string,
//   rawAttrValue: string,
//   isMustacheSyntax: boolean,
//   wxmlTextlines: string[],
//   startLine: number,
//   diagnosticList: vscode.Diagnostic[],
//   // 期望的值
//   expectValues: string[],
//   expectIncludes: boolean,
// ): boolean {
//   // 1. 是否有值
//   if (
//     !checkWithoutValue(tagName, rawAttrName, rawAttrValue, wxmlTextlines, startLine, isMustacheSyntax, diagnosticList)
//   ) {
//     return true;
//   }
//   // 2. 是否是期望的值
//   /**
//    * 期望的值有两种情况:
//    * 1.
//    */

//   return true;
// }
// // <subC itemC="prefix_{{item}}" indexC="prefix_{{index}}"  />
// // // <view class="aaa {{bbb}} ddd {{ a > b ? xxx : yyy }}"  >
// // // <block wx:for="1234556" />
