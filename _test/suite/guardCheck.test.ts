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
import { Uri } from "vscode";

import { linter } from "../../_src/linter/index.js";
import { nonNullable } from "../../_src/utils/nonNullable.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

suite("guardCheck", () => {
  beforeEach(() => {
    // 激活测试钩子并清理目录状态，避免测试用例相互污染。
    linter.__testClearCheckedDirs();
    linter.__test__ = { skippedNonComponent: [], skippedCheckedDir: [] };
  });

  afterEach(() => {
    // 清理钩子，避免影响后续测试
    delete linter.__test__;
    linter.__testClearCheckedDirs();
  });

  test("打开 app.ts（非组件文件）应被跳过", () => {
    const uri = Uri.file(path.join(PROJECT_ROOT, "_test/miniprogram/app.ts"));
    assert.strictEqual(linter.__testGuardCheck(uri), false);

    assert.ok(
      nonNullable(linter.__test__).skippedNonComponent.some((p) => p.endsWith("app.ts")),
      "app.ts 应在跳过列表中",
    );
    // 不应触发 checkedDir 跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedCheckedDir.length, 0);
  });

  test("打开 subInline/index.ts（组件文件）不应被跳过", () => {
    const uri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subInline/index.ts"),
    );
    assert.strictEqual(linter.__testGuardCheck(uri), true);

    // 组件文件不应被记录为跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedNonComponent.length, 0);
    // 首次打开，也不应触发 checkedDir 跳过
    assert.strictEqual(nonNullable(linter.__test__).skippedCheckedDir.length, 0);
  });

  test("已检查目录中的组件文件应被 checkedDir 跳过", () => {
    const uri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subExternal/subExternal.ts"),
    );

    // 模拟首次组件检测成功后的目录状态。
    assert.strictEqual(linter.__testGuardCheck(uri), true);
    linter.__testMarkCheckedDir(uri);

    // 清空首次检查记录，验证第二次守卫的结果。
    linter.__test__ = { skippedNonComponent: [], skippedCheckedDir: [] };
    const siblingUri = Uri.file(
      path.join(PROJECT_ROOT, "_test/miniprogram/components/subExternal/subExternal.json"),
    );
    assert.strictEqual(linter.__testGuardCheck(siblingUri), false);

    assert.strictEqual(
      linter.__test__.skippedCheckedDir.length,
      1,
      "重复打开应被 checkedDir 跳过",
    );
  });
});
