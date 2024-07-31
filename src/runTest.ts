import * as path from "path";
import * as vscode from "vscode";
import { componentManager } from "./componentManager";
import { jsonFileManager } from "./componentManager/jsonFileManager";
import { type ComponentUri, type JsonFsPath, uriHelper, type WxmlFsPath } from "./componentManager/uriHelper";
import { wxmlFileManager } from "./componentManager/wxmlFileManager";
import { diagnosticFixProvider } from "./diagnosticFixProvider";
import { diagnosticManager } from "./diagnosticManager";
import { assertNonNullable } from "./utils/assertNonNullable";
import { findDiffItems } from "./utils/findDiffItems";

export type CheckType = "wxml" | "json";

export type TestInfo = {
  state: boolean;
  checkType: CheckType;
  expectedDiagnosticList: string[];
  fiexedDiagnosticList?: string[];
};

async function expectDiagnosticsCheck(
  randomUri: ComponentUri,
  componentFileFsPath: WxmlFsPath | JsonFsPath,
  expectErrorMessageList: string[],
  testFileFsPath: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    componentManager.registerCheckedCallback(componentFileFsPath, (diagnosticList) => {
      // 2 取消回调,确定回调只能被调用一次,因为修复功能还会触发检测(检测完会触发回调)
      componentManager.deregisterCheckedCallback(componentFileFsPath);
      // 测试预期诊断错误
      const diffErrorMessage = findDiffItems(
        diagnosticList.map((diagnostic) => diagnostic.message),
        expectErrorMessageList,
      );
      // 预期一致
      if (diffErrorMessage.length === 0) {
        return resolve(true);
      }
      console.error(`预期诊断测试失败: ${testFileFsPath}`, diffErrorMessage.join());

      return resolve(false);
    });
    // 打开文件触发诊断并运行上面注册的回调。
    void vscode.workspace.openTextDocument(randomUri);
  });
}
const componentExtnameList = [".wxml", ".json", ".ts"] as const;

function getRandomExtname(): typeof componentExtnameList[number] {
  return componentExtnameList[Math.floor(Math.random() * componentExtnameList.length)];
}

async function getFixAllAction(
  randomUri: ComponentUri,
  checkType: CheckType,
  diagnosticList: readonly vscode.Diagnostic[],
): Promise<vscode.CodeAction> {
  let fixAllAction: vscode.CodeAction;
  if (checkType === "wxml") {
    fixAllAction = diagnosticFixProvider.generateFixAllAction(
      uriHelper.getSiblingUri(randomUri, ".wxml"),
      diagnosticList,
    );

    return fixAllAction;
  }
  if (checkType === "json") {
    const jsonUri = uriHelper.getSiblingUri(randomUri, ".json");
    fixAllAction = diagnosticFixProvider.generateFixAllActionOfJson(
      jsonUri,
      diagnosticList,
      (await jsonFileManager.get(jsonUri)).text,
    );

    return fixAllAction;
  }
  throw new Error("Invalid checkType");
}
// 测试用例数量
const checkExampleCount = 23;
// 完成用例数量
let completedCountOfExample = 0;

function completedCount(): void {
  completedCountOfExample++;
  if (completedCountOfExample === checkExampleCount) {
    console.log(`${checkExampleCount}个测试示例全部测试完成`);
  }
  if (completedCountOfExample > checkExampleCount) {
    console.log("测试实例多余预期数量", completedCountOfExample);
  }
}

// 获取原始文件内容
async function getOriginText(componentUri: ComponentUri, type: CheckType): Promise<string> {
  if (type === "wxml") {
    return (await wxmlFileManager.get(uriHelper.getSiblingUri(componentUri, ".wxml"))).text;
  }
  if (type === "json") {
    return (await jsonFileManager.get(uriHelper.getSiblingUri(componentUri, ".json"))).text;
  }
  throw new Error("Invalid type");
}

async function replaceFileContent(uri: ComponentUri, newContent: string): Promise<boolean> {
  const document = await vscode.workspace.openTextDocument(uri);
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  );
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, fullRange, newContent);

  return await vscode.workspace.applyEdit(edit);
}

async function checkFixed(
  randomUri: ComponentUri,
  testFileFsPath: string,
  checkType: CheckType,
  componentFileFsPath: WxmlFsPath | JsonFsPath,
  expectAfterFixedErrorMessageList: string[],
): Promise<boolean> {
  // @ts-expect-error `.${checkType}`是合法的,但是ts报错
  const diagnosticList = assertNonNullable(diagnosticManager.get(uriHelper.getSiblingUri(randomUri, `.${checkType}`)));
  const fixAllAction = await getFixAllAction(randomUri, checkType, diagnosticList);
  const originText = await getOriginText(randomUri, checkType);

  return new Promise((resolve) => {
    // 即修复后的错误信息是否符合预期

    if (assertNonNullable(fixAllAction.edit).size === 0) {
      console.error("无诊断错误,但是配置中有修复后错误信息", testFileFsPath);

      return resolve(false);
    } else {
      componentManager.registerCheckedCallback(componentFileFsPath, async (fixedDiagnostics) => {
        componentManager.deregisterCheckedCallback(componentFileFsPath);
        const diffErrorMessage = findDiffItems(
          fixedDiagnostics.map((diagnostic) => diagnostic.message),
          expectAfterFixedErrorMessageList,
        );
        if (diffErrorMessage.length === 0) {
          const uri = checkType === "wxml"
            ? uriHelper.getSiblingUri(randomUri, ".wxml")
            : uriHelper.getSiblingUri(randomUri, ".json");

          // 测试通过
          console.log("\x1b[32m%s\x1b[0m", `${testFileFsPath}`);
          await replaceFileContent(uri, originText);

          setTimeout(() => {
            return resolve(true);
          }, 200);
        } else {
          console.error(
            testFileFsPath,
            "修复后还有错误",
            fixedDiagnostics.map((diagnostic) => diagnostic.message).join(),
          );

          return resolve(false);
        }
      });

      void vscode.workspace.applyEdit(assertNonNullable(fixAllAction.edit));
    }
  });
}

async function componentTest(
  testFileUri: vscode.Uri,
  checkType: CheckType,
  expectedDiagnosticList: string[],
  fiexedDiagnosticList?: string[],
): Promise<void> {
  // 获取随机componentUri
  const componentUri = vscode.Uri.file(testFileUri.fsPath.replace(".test.js", getRandomExtname())) as ComponentUri;
  // 获取测试文件的路径
  const testFileFsPath = testFileUri.fsPath;
  // 获取测试组件文件的路径
  const componentFileFsPath = checkType === "wxml"
    ? uriHelper.getWxmlFsPath(uriHelper.getSiblingUri(componentUri, ".wxml"))
    : uriHelper.getJsonFsPath(uriHelper.getSiblingUri(componentUri, ".json"));
  // 预期的诊断错误测试
  const expectCheckResult = await expectDiagnosticsCheck(
    componentUri,
    componentFileFsPath,
    expectedDiagnosticList,
    testFileFsPath,
  );
  if (!expectCheckResult) return;

  // 不需要测试修复功能
  if (!fiexedDiagnosticList) {
    // 测试通过
    console.log("\x1b[32m%s\x1b[0m", `${testFileFsPath}`);

    return;
  }
  // 需要测试修复功能
  await checkFixed(
    componentUri,
    testFileFsPath,
    checkType,
    componentFileFsPath,
    fiexedDiagnosticList,
  );
}

export async function runTest(): Promise<void> {
  // ts解析器测试
  await import(path.resolve(__dirname, "../test/tsFileParser"));
  // 获取全部的测试文件(*.test.js)
  const testFileUriList = await vscode.workspace.findFiles("test/**/*.test.js");
  for (const testFileUri of testFileUriList) {
    const testFileFsPath = testFileUri.fsPath;
    // 读取测试文件配置信息
    let testInfo: TestInfo;
    try {
      testInfo = await import(testFileFsPath) as TestInfo;
    } catch (error) {
      console.error("导入测试文件失败", testFileFsPath, error);
      // 可以在这里继续处理错误，比如跳过当前循环的剩余部分
      continue;
    }
    const { state, checkType, expectedDiagnosticList, fiexedDiagnosticList } = testInfo;
    // 不需要测试的跳过
    if (!state) continue;
    // 运行测试
    await componentTest(
      testFileUri,
      checkType,
      expectedDiagnosticList,
      fiexedDiagnosticList,
    );
    completedCount();
  }
}
