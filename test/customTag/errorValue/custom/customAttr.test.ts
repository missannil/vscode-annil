import * as vscode from "vscode";
import { DiagnosticErrorType, type ErrorValue } from "../../../../out/diagnosticFixProvider/errorType";
import type { WxmlUri } from "../../../../src/componentManager/isComponentUri";
import type { MustacheSyntax } from "../../../../src/diagnosticFixProvider/errorType";
import { getRandomComponentUri } from "../../../tools/getComponentUri";
import { test } from "../../../tools/testHandle";

// 把当前文件的路径替换成wxml文件的路径,注意路径是以.test.js结尾的,因为运行时ts文件已被编译成js文件
const wxmlUri = vscode.Uri.file(__filename.replace(".test.js", ".wxml")) as WxmlUri;
const componentUri = getRandomComponentUri(wxmlUri);
void test(componentUri, "wxml", [
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.mustacheSyntax}:numA` satisfies MustacheSyntax,
  `${DiagnosticErrorType.mustacheSyntax}:numA` satisfies MustacheSyntax,
], [
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
  `${DiagnosticErrorType.errorValue}:numA` satisfies ErrorValue,
]);
