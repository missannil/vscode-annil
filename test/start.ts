import * as vscode from "vscode";
import { getDocumentText } from "./tools/getDocumentText";
import { replaceDocumentText } from "./tools/replaceDocumentText";
import { tsFileParserTest } from "./tsFileParser";
const suiteQueue: (() => Promise<void>)[] = [];

const totalCount = 41;
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
  const allCases = await vscode.workspace.findFiles("case/**/comment/**/*.test.js");
  const commentCases = await vscode.workspace.findFiles("case/**/comment/**/*.test.js");
  const customTagCases = await vscode.workspace.findFiles("case/**/customTag/**/*.test.js");
  const nativeTagCases = await vscode.workspace.findFiles("case/**/nativeTag/**/*.test.js");
  const elementTagCases = await vscode.workspace.findFiles("case/**/element/**/*.test.js");
  const wxForBlock = await vscode.workspace.findFiles("case/**/wxForBlock/**/*.test.js");
  const conditionalBlock = await vscode.workspace.findFiles("case/**/conditionalBlock/**/*.test.js");
  const jsonError = await vscode.workspace.findFiles("case/**/jsonError/**/*.test.js");
  const text = await vscode.workspace.findFiles("case/**/text/**/*.test.js");
  const element = await vscode.workspace.findFiles("case/**/element/**/*.test.js");
  const caseList = [
    ...commentCases,
    ...element,
    ...text,
    ...jsonError,
    // ...customTagCases,
    // ...nativeTagCases,
  ];
  const ignore: string[] = [];
  for (const testFileUri of caseList) {
    // -8是为了去掉.test.js
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // if (ignore.includes(testFileUri.fsPath.split("/").pop()!.slice(0, -8))) {
    //   continue;
    // }
    await import(testFileUri.fsPath);
    if (testFileUri.fsPath.includes("withoutValueOfBlock")) {
      // await import(testFileUri.fsPath);
    }
  }
}

export async function runTest(): Promise<void> {
  // console.log("测试开始");
  // ts解析器测试
  await tsFileParserTest();
  // 文件测试
  await suiteTest();
}

void runTest();
