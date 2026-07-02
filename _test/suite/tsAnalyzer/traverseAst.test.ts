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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

suite("traverseAst", () => {
  test("解析 pages/index/index.ts 的 RootComponent 信息与预期一致", () => {
    // 编译后路径: out/_test/suite/tsAnalyzer/ → ../../../.. → 项目根 → _test/miniprogram/...
    const demoFsPath = path.resolve(
      __dirname,
      "../../../..",
      "_test/miniprogram/pages/index/index.ts",
    );
    const tsText = fs.readFileSync(demoFsPath, "utf-8");

    // 调用被测试函数
    const { rootComponentInfo } = traverseAst(
      demoFsPath,
      tsText,
      configuration.innerDataPrefix,
    );

    // 辅助：排序后对比（顺序无关）
    const sorted = (arr: string[]): string[] => [...arr].sort();

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
});
