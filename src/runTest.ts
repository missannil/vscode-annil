import * as path from "path";
import * as vscode from "vscode";

// 测试tsFileParser
async function testTsParser(): Promise<void> {
  const { tsFileParserTest } = await import(path.resolve(__dirname, "../test/tsFileParser"));
  void tsFileParserTest();
}

export async function runTest(): Promise<void> {
  // ts解析器测试
  void testTsParser();
  // 获取测试文件列表
  const testFileUriList = await vscode.workspace.findFiles("test/**/*.test.js");
  for (const testUri of testFileUriList) {
    await import(testUri.fsPath);
  }
}
