import * as vscode from "vscode";
import { CUSTOM } from "../../../out/componentManager/tsFileManager";
import type { WxmlUri } from "../../../src/componentManager/isComponentUri";
import { DiagnosticErrorType, type ErrorValue, type WithoutValue } from "../../../src/diagnosticFixProvider/errorType";
import { getRandomComponentUri } from "../../tools/getComponentUri";
import { test } from "../../tools/testHandle";

// 把当前文件的路径替换成wxml文件的路径,注意路径是以.test.js结尾的,因为运行时ts文件已被编译成js文件
const wxmlUri = vscode.Uri.file(__filename.replace(".test.js", ".wxml")) as WxmlUri;
const componentUri = getRandomComponentUri(wxmlUri);
void test(componentUri, [
  `${DiagnosticErrorType.withoutValue}:_id` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:numA` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:userList` satisfies WithoutValue,
  `${DiagnosticErrorType.withoutValue}:bind:onTap` satisfies WithoutValue,
], [
  `${DiagnosticErrorType.errorValue}:_id` satisfies ErrorValue,
]);
