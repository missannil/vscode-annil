import * as vscode from "vscode";
import type { WxmlUri } from "../../../../src/componentManager/isComponentUri";
import {
  DiagnosticErrorType,
  type InvalidValue,
  type MustacheSyntax,
  type NonArrType,
} from "../../../../src/diagnosticFixProvider/errorType";
import { getRandomComponentUri } from "../../../tools/getComponentUri";
import { test } from "../../../tools/testHandle";

// 把当前文件的路径替换成wxml文件的路径,注意路径是以.test.js结尾的,因为运行时ts文件已被编译成js文件
const wxmlUri = vscode.Uri.file(__filename.replace(".test.js", ".wxml")) as WxmlUri;
const componentUri = getRandomComponentUri(wxmlUri);
void test(componentUri, [
  `${DiagnosticErrorType.mustacheSyntax}:wx:for` satisfies MustacheSyntax,
  `${DiagnosticErrorType.invalidValue}:wx:for-index` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:for-item` satisfies InvalidValue,
  `${DiagnosticErrorType.mustacheSyntax}:wx:if` satisfies MustacheSyntax,
  `${DiagnosticErrorType.invalidValue}:wx:elif` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
], [
  `${DiagnosticErrorType.nonArrType}` satisfies NonArrType,
  `${DiagnosticErrorType.invalidValue}:wx:for-index` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:for-item` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:elif` satisfies InvalidValue,
  `${DiagnosticErrorType.invalidValue}:wx:if` satisfies InvalidValue,
]);
