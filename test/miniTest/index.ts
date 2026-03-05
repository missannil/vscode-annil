import * as vscode from "vscode";
export async function miniTest(): Promise<void> {
  // 打开测试demo文件
  const caseUriList = await vscode.workspace.findFiles("miniTest/demo/xxx/xxx.wxml");
  const doc = await vscode.workspace.openTextDocument(caseUriList[0]);
  // 显示文件，并设置为预览模式，保持焦点在当前编辑器
  await vscode.window.showTextDocument(doc, {
    preview: true, // 固定标签页，避免被预览替换
    preserveFocus: true, // 确保成为活动编辑器
  });
  // 调用命令生成测试文件
  await vscode.commands.executeCommand("annil.generateTestFileForMiniTest");
  // 读取生成的测试文件内容
  const testFileUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, "miniTest/components/xxx.py");
  const testDoc = await vscode.workspace.openTextDocument(testFileUri);
  const generatedContent = testDoc.getText();
  // 读取预期的测试文件内容
  const expectedFileUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders![0].uri,
    "miniTest/components/expectXXX.py",
  );
  const expectedDoc = await vscode.workspace.openTextDocument(expectedFileUri);
  const expectedContent = expectedDoc.getText();
  // 比较生成的内容与预期内容,切割成数组进行比较
  const generatedLines = generatedContent.split("\n");
  const expectedLines = expectedContent.split("\n");
  // 比较每行内容，不同的行数打印差异
  if (generatedLines.length !== expectedLines.length) {
    console.error(`行数不匹配: 生成的行数 ${generatedLines.length}, 预期的行数 ${expectedLines.length}`);
    return;
  }
  generatedLines.forEach((line, index) => {
    if (line !== expectedLines[index]) {
      console.error(`第 ${index + 1} 行不匹配:\n生成的行: ${line}\n预期的行: ${expectedLines[index]}`);
    }
  });
}
