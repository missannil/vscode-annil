/**
 * 忽略文件检查测试
 * 通过 linter.__test__ 钩子直接验证：
 * 1. 打开非组件文件 → __test__.skippedNonComponent 记录
 * 2. 打开组件文件 → 不记录任何跳过
 * 3. 再次打开同一组件 → __test__.skippedCheckedDir 记录
 */
import * as assert from "assert";
import { describe as suite, it as test } from "mocha";
import * as path from "path";
import { fileURLToPath } from "url";
import { Uri, window, workspace } from "vscode";

import { vscode } from "#deps";
import { linter } from "../../_src/linter/index.js";
import { nonNullable } from "../../_src/utils/nonNullable.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

suite("guardCheck", () => {
  beforeEach(() => {
    // 激活测试钩子，每次测试前清空记录
    linter.__test__ = { skippedNonComponent: [], skippedCheckedDir: [] };
  });

  afterEach(() => {
    // 清理钩子，避免影响后续测试
    delete linter.__test__;
  });

  test("打开 app.ts（非组件文件）应被跳过", async () => {
    const uri = Uri.file(path.join(PROJECT_ROOT, "_test/miniprogram/app.ts"));
    const doc = await workspace.openTextDocument(uri);
    await window.showTextDocument(doc);

    // 等待 linter 的异步守卫执行
    await new Promise((r) => setTimeout(r, 500));

    assert.ok(
      nonNullable(linter.__test__).skippedNonComponent.some((p) => p.endsWith("app.ts")),
      "app.ts 应在跳过列表中",
    );
    // 不应触发 checkedDir 跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedCheckedDir.length, 0);
  });

  // 等待额外时间以让 linter 内部的 debounce / setTimeout 回调有机会执行完毕，
  // 避免 Extension Host 过早关闭导致 "Channel has been closed" 错误。
  after(async () => {
    await new Promise((r) => setTimeout(r, 1000));
  });

  test("打开 subInline/index.ts（组件文件）不应被跳过", async () => {
    const uri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subInline/index.ts"),
    );
    const doc = await workspace.openTextDocument(uri);
    await window.showTextDocument(doc);

    await new Promise((r) => setTimeout(r, 500));

    // 组件文件不应被记录为跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedNonComponent.length, 0);
    // 首次打开，也不应触发 checkedDir 跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedCheckedDir.length, 0);
  });

  test("再次打开同一组件文件应被 checkedDir 跳过", async () => {
    const uri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subExternal/subExternal.ts"),
    );

    // 第一次打开，触发首次检测
    const doc = await workspace.openTextDocument(uri);
    await window.showTextDocument(doc);
    await new Promise((r) => setTimeout(r, 500));

    // 重置记录（第一次打开的守卫逻辑已执行完毕）
    linter.__test__ = { skippedNonComponent: [], skippedCheckedDir: [] };

    // 关闭 active editor，再打开同目录的兄弟文件 – 目录已在 #checkedDirs 中
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    const siblingUri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subExternal/subExternal.json"),
    );
    const siblingDoc = await workspace.openTextDocument(siblingUri);
    await window.showTextDocument(siblingDoc);
    await new Promise((r) => setTimeout(r, 500));

    assert.strictEqual(
      linter.__test__.skippedCheckedDir.length,
      1,
      "重复打开应被 checkedDir 跳过",
    );
  });
});
