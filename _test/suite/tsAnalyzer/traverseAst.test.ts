/**
 * traverseAst 测试
 *
 * 读取 _test/miniprogram/pages/index/index.ts，
 * 调用 traverseAst 解析 RootComponent 信息并与预期值对比。
 */
import { assert, fileURLToPath, fs, path } from "#deps";
import { describe as suite, it as test } from "mocha";

// 直接从源码模块导入（dev 模式下 _src/ 按目录结构编译到 out/_src/）
import { configuration } from "../../../_src/configuration/index.js";
import { traverseAst } from "../../../_src/core/tsAnalyzer/index.js";
// 预期数据
import { expectedRootComponentInfo } from "./expectedRootComponentInfo.js";
import { expectedSubComponentInfoRecord } from "./expectedSubComponentInfoRecord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite("traverseAst", () => {
  // 辅助：排序后对比（顺序无关）
  const sorted = (arr: string[]): string[] => [...arr].sort();

  // 公共：解析 index.ts
  const demoFsPath = path.resolve(
    __dirname,
    "../../../..",
    "_test/miniprogram/pages/index/index.ts",
  );
  const tsText = fs.readFileSync(demoFsPath, "utf-8");
  const { rootComponentInfo, subComponentInfoRecord } = traverseAst(
    demoFsPath,
    tsText,
    configuration.innerDataPrefix,
  );

  test("解析 pages/index/index.ts 的 RootComponent 信息与预期一致", () => {
    assert.deepStrictEqual(
      sorted(rootComponentInfo.arrTypeDatas),
      sorted(expectedRootComponentInfo.arrTypeDatas),
      "arrTypeDatas 不匹配",
    );
    assert.deepStrictEqual(
      sorted(rootComponentInfo.boolTypeDatas),
      sorted(expectedRootComponentInfo.boolTypeDatas),
      "boolTypeDatas 不匹配",
    );
    assert.deepStrictEqual(
      sorted(rootComponentInfo.dataList),
      sorted(expectedRootComponentInfo.dataList),
      "dataList 不匹配",
    );
    assert.deepStrictEqual(
      sorted(rootComponentInfo.events),
      sorted(expectedRootComponentInfo.events),
      "events 不匹配",
    );
  });

  test("解析 pages/index/index.ts 的 SubComponent 信息与预期一致", () => {
    const expected = expectedSubComponentInfoRecord(demoFsPath);

    // 验证收集到的 SubComponent 数量
    const actualKeys = Object.keys(subComponentInfoRecord).sort();
    const expectedKeys = Object.keys(expected).sort();
    assert.deepStrictEqual(actualKeys, expectedKeys, "SubComponent 变量名列表不匹配");

    for (const key of expectedKeys) {
      const actual = subComponentInfoRecord[key];
      const exp = expected[key];
      assert.strictEqual(typeof actual, "object", `subComponentInfoRecord["${key}"] 不应为 undefined`);
      assert.strictEqual(typeof exp, "object", `expected["${key}"] 不应为 undefined`);

      if (actual === undefined || exp === undefined) continue;

      assert.strictEqual(actual.line, exp.line, `${key}.line 不匹配`);
      assert.strictEqual(actual.fsPath, exp.fsPath, `${key}.fsPath 不匹配`);
      assert.strictEqual(actual.componentTypeName, exp.componentTypeName, `${key}.componentTypeName 不匹配`);
      assert.deepStrictEqual(actual.configInfo, exp.configInfo, `${key}.configInfo 不匹配`);
      assert.deepStrictEqual(sorted(actual.arrTypeDatas), sorted(exp.arrTypeDatas), `${key}.arrTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.boolTypeDatas), sorted(exp.boolTypeDatas), `${key}.boolTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.dataList), sorted(exp.dataList), `${key}.dataList 不匹配`);
      assert.deepStrictEqual(sorted(actual.events), sorted(exp.events), `${key}.events 不匹配`);
    }
  });
});
