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
import { resolveImportedSubComponentPaths } from "../../../_src/core/tsAnalyzer/resolveImportedSubComponentPaths.js";
// 预期数据
import { expectedChunkComponentInfoRecord } from "./expectedChunkComponentInfoRecord.js";
import { expectedRootComponentInfo } from "./expectedRootComponentInfo.js";
import { expectedCustomComponentInfoRecord } from "./expectedSubComponentInfoRecord.js";

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
  const {
    chunkComponentInfoRecord,
    customComponentInfoRecord,
    importedSubComponentSourceRecord,
    rootComponentInfo,
  } = traverseAst(
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

  test("解析 pages/index/index.ts 的 CustomComponent 信息与预期一致", () => {
    const expected = expectedCustomComponentInfoRecord(demoFsPath);

    // 验证收集到的 CustomComponent 数量
    const actualKeys = Object.keys(customComponentInfoRecord).sort();
    const expectedKeys = Object.keys(expected).sort();
    assert.deepStrictEqual(actualKeys, expectedKeys, "CustomComponent 变量名列表不匹配");

    for (const key of expectedKeys) {
      const actual = customComponentInfoRecord[key];
      const exp = expected[key];
      assert.strictEqual(typeof actual, "object", `customComponentInfoRecord["${key}"] 不应为 undefined`);
      assert.strictEqual(typeof exp, "object", `expected["${key}"] 不应为 undefined`);

      if (actual === undefined || exp === undefined) continue;

      assert.strictEqual(actual.line, exp.line, `${key}.line 不匹配`);
      assert.strictEqual(actual.fsPath, exp.fsPath, `${key}.fsPath 不匹配`);
      assert.strictEqual(actual.componentTypeName, exp.componentTypeName, `${key}.componentTypeName 不匹配`);
      assert.deepStrictEqual(actual.configInfo, exp.configInfo, `${key}.configInfo 不匹配`);
      assert.deepStrictEqual(sorted(actual.arrTypeDatas), sorted(exp.arrTypeDatas), `${key}.arrTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.boolTypeDatas), sorted(exp.boolTypeDatas), `${key}.boolTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.events), sorted(exp.events), `${key}.events 不匹配`);
    }
  });

  test("只将类型来自外部 import 的 CustomComponent 收集为 JSON 导入候选", () => {
    assert.deepStrictEqual(importedSubComponentSourceRecord, {
      subInline: "~/subInline/index.js",
    });
  });

  test("baseUrl 裸路径导入转换为以 / 开头的 usingComponents 路径", () => {
    assert.deepStrictEqual(
      resolveImportedSubComponentPaths(demoFsPath, {
        subExternal: "components/subExternal/subExternal.js",
      }),
      { subExternal: "/components/subExternal/subExternal" },
    );
  });

  test("解析 pages/index/index.ts 的 ChunkComponent 信息与预期一致", () => {
    const expected = expectedChunkComponentInfoRecord(demoFsPath);
    const actualKeys = Object.keys(chunkComponentInfoRecord).sort();
    const expectedKeys = Object.keys(expected).sort();

    assert.deepStrictEqual(actualKeys, expectedKeys, "ChunkComponent 变量名列表不匹配");

    for (const key of expectedKeys) {
      const actual = chunkComponentInfoRecord[key];
      const exp = expected[key];
      assert.strictEqual(typeof actual, "object", `chunkComponentInfoRecord["${key}"] 不应为 undefined`);
      assert.strictEqual(typeof exp, "object", `expected["${key}"] 不应为 undefined`);

      if (actual === undefined || exp === undefined) continue;

      assert.strictEqual(actual.line, exp.line, `${key}.line 不匹配`);
      assert.strictEqual(actual.fsPath, exp.fsPath, `${key}.fsPath 不匹配`);
      assert.deepStrictEqual(sorted(actual.arrTypeDatas), sorted(exp.arrTypeDatas), `${key}.arrTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.boolTypeDatas), sorted(exp.boolTypeDatas), `${key}.boolTypeDatas 不匹配`);
      assert.deepStrictEqual(sorted(actual.dataList), sorted(exp.dataList), `${key}.dataList 不匹配`);
      assert.deepStrictEqual(sorted(actual.events), sorted(exp.events), `${key}.events 不匹配`);
    }
  });
});
