import * as vscode from "vscode";
import type { WxmlUri } from "../../../src/componentManager/isComponentUri";
import { getRandomComponentUri } from "../../tools/getComponentUri";
import { test } from "../../tools/testHandle";
// 把当前文件的路径替换成wxml文件的路径,注意路径是以.test.js结尾的,因为运行时ts文件已被编译成js文件
const wxmlUri = vscode.Uri.file(__filename.replace(".test.js", ".wxml")) as WxmlUri;
const componentUri = getRandomComponentUri(wxmlUri);
// void test(componentUri, ["错误的属性值:bind:aaa","错误的属性值:bind:bbb","错误的属性值:bind:ccc"]);
