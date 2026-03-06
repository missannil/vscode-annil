import * as vscode from "vscode";
import { miniTest } from "./miniTest/index";
import { getDocumentText } from "./tools/getDocumentText";
import { replaceDocumentText } from "./tools/replaceDocumentText";
import { tsFileParserTest } from "./tsFileParser/index";
const suiteQueue: (() => Promise<void>)[] = [];

const totalCount = 46;
let itemCount = 0;

export function suite(name: string, fn: () => Promise<void>): void {
  suiteQueue.push(async () => {
    console.log(` ${name}测试开始`);

    name = name.endsWith(".json") ? name : name.concat(".wxml");
    const caseUriList = await vscode.workspace.findFiles(`case/**/${name}`);
    if (caseUriList.length > 1) {
      throw new Error(` case重名：${name}`);
    }
    const originalText = await getDocumentText(caseUriList[0]);
    try {
      await fn();
    } catch (error) {
      console.error(` ${name}测试失败`, error);
    } finally {
      await replaceDocumentText(caseUriList[0], originalText);
    }

    itemCount++;
    suiteQueue.shift();
    if (suiteQueue.length > 0) {
      void suiteQueue[0]();
    } else {
      if (itemCount < totalCount) {
        console.log(` 缺少${totalCount - itemCount}个测试`);
      } else if (itemCount === totalCount) {
        console.log(` 全部测试完成${totalCount}个`);
      } else {
        console.log(` 测试多了${itemCount - totalCount}个`);
      }
    }
  });
  if (suiteQueue.length === 1) {
    void suiteQueue[0]();
  }
}

async function suiteTest(): Promise<void> {
  const commentCases = await vscode.workspace.findFiles("case/comment/**/*.test.js");
  const customTagCases = await vscode.workspace.findFiles("case/element/customTag/**/*.test.js");
  const nativeTagCases = await vscode.workspace.findFiles("case/element/nativeTag/**/*.test.js");
  const jsonError = await vscode.workspace.findFiles("case/jsonError/**/*.test.js");
  const text = await vscode.workspace.findFiles("case/text/**/*.test.js");
  const element = await vscode.workspace.findFiles("case/element/**/*.test.js");
  const caseList = [
    ...commentCases,
    ...customTagCases,
    ...nativeTagCases,
    ...jsonError,
    ...text,
    ...element,
  ];
  for (const testFileUri of caseList) {
    // 导入测试文件(执行测试)
    await import(testFileUri.fsPath);
  }
}
export async function runTest(): Promise<void> {
  console.log("测试开始");
  // minitest生成组件测试
  await miniTest();
  // // ts解析器测试
  // await tsFileParserTest();
  // //  文件测试
  // await suiteTest();
}

void runTest();
